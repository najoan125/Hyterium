package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.BlockDto
import kr.najoan.notionclone.dto.CreateBlockRequest
import kr.najoan.notionclone.dto.UpdateBlockRequest
import kr.najoan.notionclone.entity.Block
import kr.najoan.notionclone.repository.BlockRepository
import kr.najoan.notionclone.repository.PageRepository
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
        val block = blockRepository.findById(blockId)
            .orElseThrow { IllegalArgumentException("Block not found") }

        workspaceService.checkMemberAccess(block.page.workspace.id!!, userId)

        blockRepository.delete(block)
    }

    fun bulkUpdateBlocks(
        pageId: Long,
        userId: Long,
        blocks: List<CreateBlockRequest>
    ): List<BlockDto> {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        blockRepository.deleteAllByPageId(pageId)

        val savedBlocks = blocks.map { request ->
            val block = Block(
                page = page,
                type = request.type,
                content = request.content,
                properties = request.properties,
                position = request.position
            )
            blockRepository.save(block)
        }

        return savedBlocks.map { toDto(it) }
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
