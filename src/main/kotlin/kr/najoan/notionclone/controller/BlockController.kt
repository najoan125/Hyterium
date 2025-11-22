package kr.najoan.notionclone.controller

import kr.najoan.notionclone.dto.BlockDto
import kr.najoan.notionclone.dto.BlockUpdateRequest
import kr.najoan.notionclone.dto.CreateBlockRequest
import kr.najoan.notionclone.dto.UpdateBlockRequest
import kr.najoan.notionclone.security.UserPrincipal
import kr.najoan.notionclone.service.BlockService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/pages/{pageId}/blocks")
class BlockController(
    private val blockService: BlockService
) {

    @PostMapping
    fun createBlock(
        @PathVariable pageId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody request: CreateBlockRequest
    ): ResponseEntity<BlockDto> {
        val block = blockService.createBlock(pageId, userPrincipal.user.id!!, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(block)
    }

    @GetMapping
    fun getPageBlocks(
        @PathVariable pageId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<List<BlockDto>> {
        val blocks = blockService.getPageBlocks(pageId, userPrincipal.user.id!!)
        return ResponseEntity.ok(blocks)
    }

    @PutMapping("/{blockId}")
    fun updateBlock(
        @PathVariable pageId: Long,
        @PathVariable blockId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody request: UpdateBlockRequest
    ): ResponseEntity<BlockDto> {
        val block = blockService.updateBlock(blockId, userPrincipal.user.id!!, request)
        return ResponseEntity.ok(block)
    }

    @DeleteMapping("/{blockId}")
    fun deleteBlock(
        @PathVariable pageId: Long,
        @PathVariable blockId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<Void> {
        blockService.deleteBlock(blockId, userPrincipal.user.id!!)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/bulk")
    fun bulkUpdateBlocks(
        @PathVariable pageId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody requests: List<BlockUpdateRequest>
    ): ResponseEntity<List<BlockDto>> {
        val blocks = blockService.bulkUpdateBlocks(pageId, userPrincipal.user.id!!, requests)
        return ResponseEntity.ok(blocks)
    }
}
