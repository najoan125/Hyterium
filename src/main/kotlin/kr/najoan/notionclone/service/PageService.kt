package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.CreatePageRequest
import kr.najoan.notionclone.dto.PageDto
import kr.najoan.notionclone.dto.UpdatePageRequest
import kr.najoan.notionclone.dto.UserDto
import kr.najoan.notionclone.entity.Page
import kr.najoan.notionclone.entity.User
import kr.najoan.notionclone.repository.PageRepository
import kr.najoan.notionclone.repository.WorkspaceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class PageService(
    private val pageRepository: PageRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceService: WorkspaceService,
    private val userService: UserService
) {

    fun createPage(
        workspaceId: Long,
        user: User,
        request: CreatePageRequest
    ): PageDto {
        workspaceService.checkMemberAccess(workspaceId, user.id!!)

        val workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow { IllegalArgumentException("Workspace not found") }

        val parentPage = request.parentPageId?.let {
            pageRepository.findById(it)
                .orElseThrow { IllegalArgumentException("Parent page not found") }
        }

        val page = Page(
            title = request.title,
            icon = request.icon,
            coverImage = request.coverImage,
            workspace = workspace,
            parentPage = parentPage,
            createdBy = user,
            lastEditedBy = user
        )

        val savedPage = pageRepository.save(page)
        return toDto(savedPage, includeChildren = false)
    }

    fun getPageById(pageId: Long, userId: Long): PageDto {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        if (page.isDeleted) {
            throw IllegalArgumentException("Page is deleted")
        }

        return toDto(page, includeChildren = true)
    }

    fun getWorkspacePages(workspaceId: Long, userId: Long): List<PageDto> {
        workspaceService.checkMemberAccess(workspaceId, userId)

        val pages = pageRepository.findAllByWorkspaceIdAndParentPageIsNullAndIsDeleted(workspaceId)
        return pages.map { toDto(it, includeChildren = true) }
    }

    fun getChildPages(pageId: Long, userId: Long): List<PageDto> {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        val childPages = pageRepository.findAllByParentPageIdAndIsDeleted(pageId)
        return childPages.map { toDto(it, includeChildren = false) }
    }

    fun updatePage(
        pageId: Long,
        user: User,
        request: UpdatePageRequest
    ): PageDto {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, user.id!!)

        request.title?.let { page.title = it }
        request.icon?.let { page.icon = it }
        request.coverImage?.let { page.coverImage = it }
        page.lastEditedBy = user
        page.updatedAt = LocalDateTime.now()

        val updatedPage = pageRepository.save(page)
        return toDto(updatedPage, includeChildren = false)
    }

    fun deletePage(pageId: Long, userId: Long) {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        page.isDeleted = true
        page.updatedAt = LocalDateTime.now()
        pageRepository.save(page)
    }

    private fun toDto(page: Page, includeChildren: Boolean): PageDto {
        val childPages = if (includeChildren) {
            pageRepository.findAllByParentPageIdAndIsDeleted(page.id!!)
                .map { toDto(it, includeChildren = false) }
        } else null

        return PageDto(
            id = page.id!!,
            title = page.title,
            icon = page.icon,
            coverImage = page.coverImage,
            workspaceId = page.workspace.id!!,
            parentPageId = page.parentPage?.id,
            createdBy = userService.toDto(page.createdBy),
            createdAt = page.createdAt.toString(),
            updatedAt = page.updatedAt.toString(),
            childPages = childPages
        )
    }
}
