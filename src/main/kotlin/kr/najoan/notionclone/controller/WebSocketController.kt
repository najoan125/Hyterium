package kr.najoan.notionclone.controller

import kr.najoan.notionclone.dto.*
import kr.najoan.notionclone.entity.User
import kr.najoan.notionclone.security.UserPrincipal
import kr.najoan.notionclone.service.BlockService
import kr.najoan.notionclone.service.PageService
import kr.najoan.notionclone.service.WorkspaceService
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessageSendingOperations
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.stereotype.Controller
import java.security.Principal

@Controller
class WebSocketController(
    private val messagingTemplate: SimpMessageSendingOperations,
    private val pageService: PageService,
    private val blockService: BlockService,
    private val workspaceService: WorkspaceService
) {

    private fun getUserFromPrincipal(principal: Principal): User {
        val authToken = principal as? UsernamePasswordAuthenticationToken
            ?: throw IllegalArgumentException("Invalid authentication principal")

        val userPrincipal = authToken.principal as? UserPrincipal
            ?: throw IllegalArgumentException("Invalid user principal")

        return userPrincipal.user
    }

    @MessageMapping("/workspace/{workspaceId}/page/{pageId}/join")
    fun handleUserJoin(
        @DestinationVariable workspaceId: Long,
        @DestinationVariable pageId: Long,
        principal: Principal
    ) {
        val user = getUserFromPrincipal(principal)

        workspaceService.checkMemberAccess(workspaceId, user.id!!)

        val message = WebSocketMessage(
            type = WebSocketEventType.USER_JOINED,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = null,
            userId = user.id!!,
            username = user.username,
            data = UserPresenceEvent(
                userId = user.id!!,
                username = user.username,
                avatarUrl = user.avatarUrl,
                pageId = pageId
            )
        )

        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId.page.$pageId", message)
    }

    @MessageMapping("/workspace/{workspaceId}/page/{pageId}/leave")
    fun handleUserLeave(
        @DestinationVariable workspaceId: Long,
        @DestinationVariable pageId: Long,
        principal: Principal
    ) {
        val user = getUserFromPrincipal(principal)

        val message = WebSocketMessage(
            type = WebSocketEventType.USER_LEFT,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = null,
            userId = user.id!!,
            username = user.username,
            data = UserPresenceEvent(
                userId = user.id!!,
                username = user.username,
                avatarUrl = user.avatarUrl,
                pageId = pageId
            )
        )

        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId.page.$pageId", message)
    }

    @MessageMapping("/workspace/{workspaceId}/page/{pageId}/update")
    fun handlePageUpdate(
        @DestinationVariable workspaceId: Long,
        @DestinationVariable pageId: Long,
        @Payload updateRequest: UpdatePageRequest,
        principal: Principal
    ) {
        val user = getUserFromPrincipal(principal)

        workspaceService.checkMemberAccess(workspaceId, user.id!!)

        val updatedPage = pageService.updatePage(pageId, user, updateRequest)

        val message = WebSocketMessage(
            type = WebSocketEventType.PAGE_UPDATED,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = null,
            userId = user.id!!,
            username = user.username,
            data = updatedPage
        )

        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId.page.$pageId", message)
    }

    @MessageMapping("/workspace/{workspaceId}/page/{pageId}/block/update")
    fun handleBlockUpdate(
        @DestinationVariable workspaceId: Long,
        @DestinationVariable pageId: Long,
        @Payload payload: Map<String, Any>,
        principal: Principal
    ) {
        val user = getUserFromPrincipal(principal)

        workspaceService.checkMemberAccess(workspaceId, user.id!!)

        val blockId = (payload["blockId"] as Number).toLong()
        val updateRequest = UpdateBlockRequest(
            type = payload["type"] as String?,
            content = payload["content"] as String?,
            properties = payload["properties"] as String?,
            position = (payload["position"] as Number?)?.toInt()
        )

        val updatedBlock = blockService.updateBlock(blockId, user.id!!, updateRequest)

        val message = WebSocketMessage(
            type = WebSocketEventType.BLOCK_UPDATED,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = blockId,
            userId = user.id!!,
            username = user.username,
            data = updatedBlock
        )

        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId.page.$pageId", message)
    }

    @MessageMapping("/workspace/{workspaceId}/page/{pageId}/block/create")
    fun handleBlockCreate(
        @DestinationVariable workspaceId: Long,
        @DestinationVariable pageId: Long,
        @Payload createRequest: CreateBlockRequest,
        principal: Principal
    ) {
        val user = getUserFromPrincipal(principal)

        workspaceService.checkMemberAccess(workspaceId, user.id!!)

        val createdBlock = blockService.createBlock(pageId, user.id!!, createRequest)

        val message = WebSocketMessage(
            type = WebSocketEventType.BLOCK_CREATED,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = createdBlock.id,
            userId = user.id!!,
            username = user.username,
            data = createdBlock
        )

        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId.page.$pageId", message)
    }

    @MessageMapping("/workspace/{workspaceId}/page/{pageId}/block/{blockId}/delete")
    fun handleBlockDelete(
        @DestinationVariable workspaceId: Long,
        @DestinationVariable pageId: Long,
        @DestinationVariable blockId: Long,
        principal: Principal
    ) {
        val user = getUserFromPrincipal(principal)

        workspaceService.checkMemberAccess(workspaceId, user.id!!)

        blockService.deleteBlock(blockId, user.id!!)

        val message = WebSocketMessage(
            type = WebSocketEventType.BLOCK_DELETED,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = blockId,
            userId = user.id!!,
            username = user.username,
            data = null
        )

        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId.page.$pageId", message)
    }

    @MessageMapping("/workspace/{workspaceId}/page/{pageId}/blocks/bulk-update")
    fun handleBlocksBulkUpdate(
        @DestinationVariable workspaceId: Long,
        @DestinationVariable pageId: Long,
        @Payload blocks: List<BlockUpdateRequest>,
        principal: Principal
    ) {
        val user = getUserFromPrincipal(principal)

        workspaceService.checkMemberAccess(workspaceId, user.id!!)

        val updatedBlocks = blockService.bulkUpdateBlocks(pageId, user.id!!, blocks)

        val message = WebSocketMessage(
            type = WebSocketEventType.BLOCKS_BULK_UPDATED,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = null,
            userId = user.id!!,
            username = user.username,
            data = BlocksUpdateEvent(pageId = pageId, blocks = updatedBlocks)
        )

        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId.page.$pageId", message)
    }

    @MessageMapping("/workspace/{workspaceId}/page/{pageId}/cursor")
    fun handleCursorMove(
        @DestinationVariable workspaceId: Long,
        @DestinationVariable pageId: Long,
        @Payload cursorEvent: CursorPositionEvent,
        principal: Principal
    ) {
        val user = getUserFromPrincipal(principal)

        workspaceService.checkMemberAccess(workspaceId, user.id!!)

        val message = WebSocketMessage(
            type = WebSocketEventType.CURSOR_MOVED,
            workspaceId = workspaceId,
            pageId = pageId,
            blockId = cursorEvent.blockId,
            userId = user.id!!,
            username = user.username,
            data = cursorEvent
        )

        messagingTemplate.convertAndSend("/topic/workspace.$workspaceId.page.$pageId", message)
    }
}
