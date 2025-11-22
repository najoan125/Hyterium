package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.BlockDto
import kr.najoan.notionclone.dto.BlockUpdateRequest
import kr.najoan.notionclone.dto.CreateBlockRequest
import kr.najoan.notionclone.dto.UpdateBlockRequest
import kr.najoan.notionclone.entity.Block
import kr.najoan.notionclone.repository.BlockRepository
import kr.najoan.notionclone.repository.PageRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

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
            clientId = UUID.randomUUID().toString(), // 단일 생성 시 clientId 생성
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

    @Transactional(readOnly = true)
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

        if (blockOptional.isEmpty) {
            logger.info("Block $blockId already deleted or does not exist, treating as success")
            return
        }

        val block = blockOptional.get()
        workspaceService.checkMemberAccess(block.page.workspace.id!!, userId)
        blockRepository.delete(block)
    }

    fun bulkUpdateBlocks(
        pageId: Long,
        userId: Long,
        requests: List<BlockUpdateRequest>
    ): List<BlockDto> {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }
        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        val existingBlocks = blockRepository.findAllByPageId(pageId)
        val existingBlocksMap = existingBlocks.filter { it.clientId != null }.associateBy { it.clientId!! }
        val incomingClientIds = requests.map { it.id }.toSet()

        // Delete blocks that are no longer present
        val clientIdsToDelete = existingBlocksMap.keys.filter { it !in incomingClientIds }
        if (clientIdsToDelete.isNotEmpty()) {
            logger.info("Deleting ${clientIdsToDelete.size} blocks for page $pageId: $clientIdsToDelete")
            blockRepository.deleteByPageIdAndClientIdIn(pageId, clientIdsToDelete)
        }

        // Upsert (Update or Insert) blocks
        val blocksToSave = requests.map { request ->
            val existingBlock = existingBlocksMap[request.id]
            if (existingBlock != null) {
                // Update existing block
                existingBlock.apply {
                    type = request.type
                    content = request.content
                    properties = request.properties
                    position = request.position
                    updatedAt = LocalDateTime.now()
                }
            } else {
                // Insert new block
                Block(
                    clientId = request.id,
                    page = page,
                    type = request.type,
                    content = request.content,
                    properties = request.properties,
                    position = request.position
                )
            }
        }

        val savedBlocks = blockRepository.saveAll(blocksToSave)
        logger.info("Successfully upserted ${savedBlocks.size} blocks for page $pageId")

        // Return sorted list
        return savedBlocks.sortedBy { it.position }.map { toDto(it) }
    }

    private fun toDto(block: Block): BlockDto {
        return BlockDto(
            id = block.id!!,
            clientId = block.clientId ?: UUID.randomUUID().toString(),
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
