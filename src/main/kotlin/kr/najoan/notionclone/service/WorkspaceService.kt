package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.*
import kr.najoan.notionclone.entity.User
import kr.najoan.notionclone.entity.Workspace
import kr.najoan.notionclone.entity.WorkspaceMember
import kr.najoan.notionclone.entity.WorkspaceRole
import kr.najoan.notionclone.repository.WorkspaceMemberRepository
import kr.najoan.notionclone.repository.WorkspaceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class WorkspaceService(
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceMemberRepository: WorkspaceMemberRepository,
    private val userService: UserService
) {

    fun createWorkspace(user: User, request: CreateWorkspaceRequest): WorkspaceDto {
        val workspace = Workspace(
            name = request.name,
            description = request.description,
            icon = request.icon,
            owner = user
        )
        val savedWorkspace = workspaceRepository.save(workspace)

        val member = WorkspaceMember(
            workspace = savedWorkspace,
            user = user,
            role = WorkspaceRole.OWNER
        )
        workspaceMemberRepository.save(member)

        return toDto(savedWorkspace, WorkspaceRole.OWNER, 1)
    }

    fun getWorkspaceById(workspaceId: Long, userId: Long): WorkspaceDto {
        val workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow { IllegalArgumentException("Workspace not found") }

        val member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        val memberCount = workspaceMemberRepository.findAllByWorkspaceId(workspaceId).size

        return toDto(workspace, member.role, memberCount)
    }

    fun getAllWorkspaces(userId: Long): List<WorkspaceDto> {
        val workspaces = workspaceRepository.findAllByUserId(userId)
        return workspaces.map { workspace ->
            val member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.id!!, userId)
                .orElseThrow { IllegalArgumentException("Member not found") }
            val memberCount = workspaceMemberRepository.findAllByWorkspaceId(workspace.id).size
            toDto(workspace, member.role, memberCount)
        }
    }

    fun updateWorkspace(
        workspaceId: Long,
        userId: Long,
        request: UpdateWorkspaceRequest
    ): WorkspaceDto {
        val workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow { IllegalArgumentException("Workspace not found") }

        val member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        if (member.role != WorkspaceRole.OWNER && member.role != WorkspaceRole.ADMIN) {
            throw IllegalArgumentException("You don't have permission to update this workspace")
        }

        request.name?.let { workspace.name = it }
        request.description?.let { workspace.description = it }
        request.icon?.let { workspace.icon = it }
        workspace.updatedAt = LocalDateTime.now()

        val updatedWorkspace = workspaceRepository.save(workspace)
        val memberCount = workspaceMemberRepository.findAllByWorkspaceId(workspaceId).size

        return toDto(updatedWorkspace, member.role, memberCount)
    }

    fun deleteWorkspace(workspaceId: Long, userId: Long) {
        val workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow { IllegalArgumentException("Workspace not found") }

        if (workspace.owner.id != userId) {
            throw IllegalArgumentException("Only the owner can delete the workspace")
        }

        workspaceRepository.delete(workspace)
    }

    fun checkMemberAccess(workspaceId: Long, userId: Long): WorkspaceMember {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }
    }

    private fun toDto(workspace: Workspace, role: WorkspaceRole, memberCount: Int): WorkspaceDto {
        return WorkspaceDto(
            id = workspace.id!!,
            name = workspace.name,
            description = workspace.description,
            icon = workspace.icon,
            role = role,
            memberCount = memberCount,
            createdAt = workspace.createdAt.toString(),
            updatedAt = workspace.updatedAt.toString()
        )
    }
}
