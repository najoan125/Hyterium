package kr.najoan.notionclone.dto

import kr.najoan.notionclone.entity.WorkspaceRole

data class LoginResponse(
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: Long,
    val discordId: String,
    val username: String,
    val email: String,
    val avatarUrl: String?
)

data class WorkspaceDto(
    val id: Long,
    val name: String,
    val description: String?,
    val icon: String?,
    val role: WorkspaceRole,
    val memberCount: Int,
    val createdAt: String,
    val updatedAt: String
)

data class CreateWorkspaceRequest(
    val name: String,
    val description: String? = null,
    val icon: String? = null
) {
    init {
        require(name.isNotBlank()) { "Workspace name cannot be blank" }
        require(name.length <= 255) { "Workspace name cannot exceed 255 characters" }
        require(description == null || description.length <= 1000) {
            "Workspace description cannot exceed 1000 characters"
        }
    }
}

data class UpdateWorkspaceRequest(
    val name: String?,
    val description: String?,
    val icon: String?
) {
    init {
        require(name == null || name.isNotBlank()) { "Workspace name cannot be blank" }
        require(name == null || name.length <= 255) { "Workspace name cannot exceed 255 characters" }
        require(description == null || description.length <= 1000) {
            "Workspace description cannot exceed 1000 characters"
        }
    }
}

data class PageDto(
    val id: Long,
    val title: String,
    val icon: String?,
    val coverImage: String?,
    val workspaceId: Long,
    val parentPageId: Long?,
    val createdBy: UserDto,
    val createdAt: String,
    val updatedAt: String,
    val sortOrder: Int,
    val childPages: List<PageDto>?
)

data class CreatePageRequest(
    val title: String,
    val icon: String? = null,
    val coverImage: String? = null,
    val parentPageId: Long? = null
) {
    init {
        require(title.isNotBlank()) { "Page title cannot be blank" }
        require(title.length <= 500) { "Page title cannot exceed 500 characters" }
    }
}

data class UpdatePageRequest(
    val title: String?,
    val icon: String?,
    val coverImage: String?,
    val parentPageId: Long?
) {
    init {
        require(title == null || title.isNotBlank()) { "Page title cannot be blank" }
        require(title == null || title.length <= 500) { "Page title cannot exceed 500 characters" }
    }
}

data class ReorderPagesRequest(
    val pageOrders: List<PageOrderDto>
)

data class PageOrderDto(
    val pageId: Long,
    val sortOrder: Int,
    val parentPageId: Long?
)

data class WorkspaceMemberDto(
    val id: Long,
    val user: UserDto,
    val role: WorkspaceRole,
    val joinedAt: String
)

data class UpdateMemberRoleRequest(
    val role: WorkspaceRole
)

data class InviteLinkDto(
    val id: Long,
    val token: String,
    val url: String,  // Full invite URL
    val role: WorkspaceRole,
    val expiresAt: String?,
    val isActive: Boolean,
    val maxUses: Int?,
    val usedCount: Int,
    val createdAt: String
)

data class CreateInviteLinkRequest(
    val role: WorkspaceRole = WorkspaceRole.MEMBER,
    val expiresInDays: Int? = null,
    val maxUses: Int? = null
)
