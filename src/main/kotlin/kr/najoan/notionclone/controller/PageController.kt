package kr.najoan.notionclone.controller

import kr.najoan.notionclone.dto.CreatePageRequest
import kr.najoan.notionclone.dto.PageDto
import kr.najoan.notionclone.dto.UpdatePageRequest
import kr.najoan.notionclone.security.UserPrincipal
import kr.najoan.notionclone.service.PageService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/pages")
class PageController(
    private val pageService: PageService
) {

    @PostMapping
    fun createPage(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody request: CreatePageRequest
    ): ResponseEntity<PageDto> {
        val page = pageService.createPage(workspaceId, userPrincipal.user, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(page)
    }

    @GetMapping
    fun getWorkspacePages(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<List<PageDto>> {
        val pages = pageService.getWorkspacePages(workspaceId, userPrincipal.user.id!!)
        return ResponseEntity.ok(pages)
    }

    @GetMapping("/{pageId}")
    fun getPage(
        @PathVariable workspaceId: Long,
        @PathVariable pageId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<PageDto> {
        val page = pageService.getPageById(pageId, userPrincipal.user.id!!)
        return ResponseEntity.ok(page)
    }

    @GetMapping("/{pageId}/children")
    fun getChildPages(
        @PathVariable workspaceId: Long,
        @PathVariable pageId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<List<PageDto>> {
        val pages = pageService.getChildPages(pageId, userPrincipal.user.id!!)
        return ResponseEntity.ok(pages)
    }

    @PutMapping("/{pageId}")
    fun updatePage(
        @PathVariable workspaceId: Long,
        @PathVariable pageId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody request: UpdatePageRequest
    ): ResponseEntity<PageDto> {
        val page = pageService.updatePage(pageId, userPrincipal.user, request)
        return ResponseEntity.ok(page)
    }

    @DeleteMapping("/{pageId}")
    fun deletePage(
        @PathVariable workspaceId: Long,
        @PathVariable pageId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<Void> {
        pageService.deletePage(pageId, userPrincipal.user.id!!)
        return ResponseEntity.noContent().build()
    }
}
