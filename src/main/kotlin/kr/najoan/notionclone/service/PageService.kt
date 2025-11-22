package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.*
import kr.najoan.notionclone.entity.Page
import kr.najoan.notionclone.entity.User
import kr.najoan.notionclone.repository.PageRepository
import kr.najoan.notionclone.repository.WorkspaceRepository
import org.springframework.messaging.simp.SimpMessageSendingOperations
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class PageService(
    private val pageRepository: PageRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceService: WorkspaceService,
    private val userService: UserService,
    private val messagingTemplate: SimpMessageSendingOperations
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

        // Calculate sortOrder for new page (last position)
        val maxSortOrder = if (parentPage != null) {
            pageRepository.findAllByParentPageIdAndIsDeleted(parentPage.id!!)
                .maxOfOrNull { it.sortOrder } ?: -1
        } else {
            pageRepository.findAllByWorkspaceIdAndParentPageIsNullAndIsDeleted(workspaceId)
                .maxOfOrNull { it.sortOrder } ?: -1
        }

        val page = Page(
            title = request.title,
            icon = request.icon,
            coverImage = request.coverImage,
            workspace = workspace,
            parentPage = parentPage,
            createdBy = user,
            lastEditedBy = user,
            sortOrder = maxSortOrder + 1
        )

        val savedPage = pageRepository.save(page)
        val pageDto = toDto(savedPage, includeChildren = false)

        // Broadcast page creation to workspace level
        val message = WebSocketMessage(
            type = WebSocketEventType.PAGE_CREATED,
            workspaceId = workspaceId,
            pageId = savedPage.id,
            blockId = null,
            userId = user.id!!,
            username = user.username,
            data = pageDto
        )
        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId", message)

        return pageDto
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
        return pages.sortedBy { it.sortOrder }.map { toDto(it, includeChildren = true) }
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
        val pageDto = toDto(updatedPage, includeChildren = false)

        // Broadcast page update to workspace level (for sidebar updates)
        val message = WebSocketMessage(
            type = WebSocketEventType.PAGE_UPDATED,
            workspaceId = page.workspace.id!!,
            pageId = pageId,
            blockId = null,
            userId = user.id!!,
            username = user.username,
            data = pageDto
        )
        messagingTemplate.convertAndSend("/topic/workspace.${page.workspace.id}", message)

        return pageDto
    }

    fun reorderPages(
        workspaceId: Long,
        userId: Long,
        request: ReorderPagesRequest
    ) {
        workspaceService.checkMemberAccess(workspaceId, userId)

        request.pageOrders.forEach { order ->
            val page = pageRepository.findById(order.pageId)
                .orElseThrow { IllegalArgumentException("Page not found: ${order.pageId}") }

            if (page.workspace.id != workspaceId) {
                throw IllegalArgumentException("Page does not belong to workspace")
            }

            page.sortOrder = order.sortOrder

            // Update parent page if specified
            if (order.parentPageId != null) {
                val parentPage = pageRepository.findById(order.parentPageId)
                    .orElseThrow { IllegalArgumentException("Parent page not found") }
                page.parentPage = parentPage
            } else if (page.parentPage != null) {
                page.parentPage = null
            }

            page.updatedAt = LocalDateTime.now()
            pageRepository.save(page)
        }

        // Broadcast update to workspace level
        val user = userService.getUserById(userId)
        val message = WebSocketMessage(
            type = WebSocketEventType.PAGE_UPDATED,
            workspaceId = workspaceId,
            pageId = null,
            blockId = null,
            userId = userId,
            username = user.username,
            data = mapOf("reordered" to true)
        )
        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId", message)
    }

    fun deletePage(pageId: Long, userId: Long) {
        val page = pageRepository.findById(pageId)
            .orElseThrow { IllegalArgumentException("Page not found") }

        workspaceService.checkMemberAccess(page.workspace.id!!, userId)

        val workspaceId = page.workspace.id!!

        page.isDeleted = true
        page.updatedAt = LocalDateTime.now()
        pageRepository.save(page)

        // Broadcast page deletion to workspace level
        val user = userService.getUserById(userId)
        val message = WebSocketMessage(
            type = WebSocketEventType.PAGE_DELETED,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = null,
            userId = userId,
            username = user.username,
            data = mapOf("pageId" to pageId)
        )
        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId", message)
    }

    private fun toDto(page: Page, includeChildren: Boolean): PageDto {
        val childPages = if (includeChildren) {
            pageRepository.findAllByParentPageIdAndIsDeleted(page.id!!)
                .sortedBy { it.sortOrder }
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
            sortOrder = page.sortOrder,
            childPages = childPages
        )
    }
}
