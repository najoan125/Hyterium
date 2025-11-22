package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.BlockDto
import kr.najoan.notionclone.dto.CreateBlockRequest
import kr.najoan.notionclone.dto.UpdateBlockRequest
import kr.najoan.notionclone.entity.Block
import kr.najoan.notionclone.repository.BlockRepository
import kr.najoan.notionclone.repository.PageRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class BlockService(
    private val blockRepository: BlockRepository,
    private val pageRepository: PageRepository,
    private val workspaceService: WorkspaceService
) {
    private val logger = LoggerFactory.getLogger(BlockService::class.java)

    fun createBlock(
        pageId: Long,
        userId: Long,
        request: CreateBlockRequest
    ): BlockDto {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        val parentBlock = request.parentBlockId?.let {
            blockRepository.findById(it)
                .orElseThrow { IllegalArgumentException("Parent block not found") }
        }

        val block = Block(
            page = page,
            type = request.type,
            content = request.content,
            properties = request.properties,
            position = request.position,
            parentBlock = parentBlock
        )

        val savedBlock = blockRepository.save(block)
        return toDto(savedBlock)
    }

    fun getPageBlocks(pageId: Long, userId: Long): List<BlockDto> {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        val blocks = blockRepository.findAllByPageIdOrderByPosition(pageId)
        return blocks.map { toDto(it) }
    }

    fun updateBlock(
        blockId: Long,
        userId: Long,
        request: UpdateBlockRequest
    ): BlockDto {
        val block = blockRepository.findById(blockId)
            .orElseThrow { IllegalArgumentException("Block not found") }

        workspaceService.checkMemberAccess(block.page.workspace.id!!, userId)

        request.type?.let { block.type = it }
        request.content?.let { block.content = it }
        request.properties?.let { block.properties = it }
        request.position?.let { block.position = it }
        block.updatedAt = LocalDateTime.now()

        val updatedBlock = blockRepository.save(block)
        return toDto(updatedBlock)
    }

    fun deleteBlock(blockId: Long, userId: Long) {
        val blockOptional = blockRepository.findById(blockId)

        // 블록이 이미 존재하지 않으면 삭제 성공으로 처리 (idempotent delete)
        if (blockOptional.isEmpty) {
            logger.info("Block $blockId already deleted or does not exist, treating as success")
            return
        }

        val block = blockOptional.get()
        workspaceService.checkMemberAccess(block.page.workspace.id!!, userId)

        try {
            blockRepository.delete(block)
        } catch (e: Exception) {
            // 삭제 중 예외 발생 시 (예: 동시성 이슈로 이미 삭제됨)
            logger.warn("Exception while deleting block $blockId: ${e.message}. Block may have been already deleted.")
            // 이미 삭제된 경우라면 원하는 상태이므로 예외를 무시
        }
    }

    fun bulkUpdateBlocks(
        pageId: Long,
        userId: Long,
        blocks: List<CreateBlockRequest>
    ): List<BlockDto> {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        // 안전 검사: 빈 배열로 모든 데이터를 삭제하지 않도록 방지
        if (blocks.isEmpty()) {
            // 빈 배열이 전달되면 기존 데이터를 유지
            logger.warn("Empty blocks array received for page $pageId, keeping existing data")
            val existingBlocks = blockRepository.findAllByPageIdOrderByPosition(pageId)
            return existingBlocks.map { toDto(it) }
        }

        // 기존 블록을 먼저 백업 (로그용)
        val existingBlocks = blockRepository.findAllByPageIdOrderByPosition(pageId)
        logger.info("Updating ${existingBlocks.size} existing blocks with ${blocks.size} new blocks for page $pageId")

        try {
            // 트랜잭션 내에서 안전하게 처리
            blockRepository.deleteAllByPageId(pageId)

            val savedBlocks = blocks.mapIndexed { index, request ->
                try {
                    logger.debug("Creating block $index: type=${request.type}, position=${request.position}")

                    val block = Block(
                        page = page,
                        type = request.type,
                        content = request.content,
                        properties = request.properties,
                        position = request.position
                    )
                    val saved = blockRepository.save(block)
                    logger.debug("Block $index saved with id=${saved.id}")
                    saved
                } catch (e: Exception) {
                    logger.error("Failed to save block $index for page $pageId: ${e.message}", e)
                    throw RuntimeException("Failed to save block at position ${request.position}: ${e.message}", e)
                }
            }

            logger.info("Successfully saved ${savedBlocks.size} blocks for page $pageId")
            return savedBlocks.map { toDto(it) }
        } catch (e: Exception) {
            logger.error("Error updating blocks for page $pageId: ${e.message}", e)
            throw RuntimeException("Failed to update blocks for page $pageId: ${e.message}", e)
        }
    }

    private fun toDto(block: Block): BlockDto {
        return BlockDto(
            id = block.id!!,
            type = block.type,
            content = block.content,
            properties = block.properties,
            position = block.position,
            parentBlockId = block.parentBlock?.id,
            createdAt = block.createdAt.toString(),
            updatedAt = block.updatedAt.toString()
        )
    }
}
