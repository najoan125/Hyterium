package kr.najoan.notionclone.dto

enum class WebSocketEventType {
    PAGE_UPDATED,
    PAGE_CREATED,
    PAGE_DELETED,
    BLOCK_UPDATED,
    BLOCK_CREATED,
    BLOCK_DELETED,
    BLOCKS_BULK_UPDATED,
    USER_JOINED,
    USER_LEFT,
    CURSOR_MOVED
}

data class WebSocketMessage(
    val type: WebSocketEventType,
    val workspaceId: Long,
    val pageId: Long?,
    val blockId: Long?,
    val userId: Long,
    val username: String,
    val data: Any?
)

data class PageUpdateEvent(
    val pageId: Long,
    val title: String?,
    val icon: String?,
    val coverImage: String?
)

data class BlockUpdateEvent(
    val blockId: Long,
    val type: String?,
    val content: String?,
    val properties: String?,
    val position: Int?
)

data class BlocksUpdateEvent(
    val pageId: Long,
    val blocks: List<BlockDto>
)

data class UserPresenceEvent(
    val userId: Long,
    val username: String,
    val avatarUrl: String?,
    val pageId: Long
)

data class CursorPositionEvent(
    val userId: Long,
    val username: String,
    val blockId: Long?,
    val position: Int
)
