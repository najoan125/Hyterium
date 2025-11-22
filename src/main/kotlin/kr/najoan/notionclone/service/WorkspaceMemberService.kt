package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.UpdateMemberRoleRequest
import kr.najoan.notionclone.dto.WorkspaceMemberDto
import kr.najoan.notionclone.entity.WorkspaceMember
import kr.najoan.notionclone.entity.WorkspaceRole
import kr.najoan.notionclone.repository.WorkspaceMemberRepository
import kr.najoan.notionclone.repository.WorkspaceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class WorkspaceMemberService(
    private val workspaceMemberRepository: WorkspaceMemberRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val userService: UserService
) {

    fun getWorkspaceMembers(workspaceId: Long, userId: Long): List<WorkspaceMemberDto> {
        workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        val members = workspaceMemberRepository.findAllByWorkspaceId(workspaceId)
        return members.map { toDto(it) }
    }

    fun updateMemberRole(
        workspaceId: Long,
        memberId: Long,
        requesterId: Long,
        request: UpdateMemberRoleRequest
    ): WorkspaceMemberDto {
        val requester = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        if (requester.role != WorkspaceRole.OWNER && requester.role != WorkspaceRole.ADMIN) {
            throw IllegalArgumentException("You don't have permission to update member roles")
        }

        val member = workspaceMemberRepository.findById(memberId)
            .orElseThrow { IllegalArgumentException("Member not found") }

        if (member.workspace.id != workspaceId) {
            throw IllegalArgumentException("Member is not part of this workspace")
        }

        if (member.role == WorkspaceRole.OWNER) {
            throw IllegalArgumentException("Cannot change the role of the workspace owner")
        }

        member.role = request.role
        val updatedMember = workspaceMemberRepository.save(member)

        return toDto(updatedMember)
    }

    fun removeMember(workspaceId: Long, memberId: Long, requesterId: Long) {
        val requester = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        if (requester.role != WorkspaceRole.OWNER && requester.role != WorkspaceRole.ADMIN) {
            throw IllegalArgumentException("You don't have permission to remove members")
        }

        val member = workspaceMemberRepository.findById(memberId)
            .orElseThrow { IllegalArgumentException("Member not found") }

        if (member.role == WorkspaceRole.OWNER) {
            throw IllegalArgumentException("Cannot remove the workspace owner")
        }

        workspaceMemberRepository.delete(member)
    }

    fun leaveWorkspace(workspaceId: Long, userId: Long) {
        val member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        if (member.role == WorkspaceRole.OWNER) {
            throw IllegalArgumentException("The owner cannot leave the workspace. Transfer ownership first or delete the workspace.")
        }

        workspaceMemberRepository.delete(member)
    }

    private fun toDto(member: WorkspaceMember): WorkspaceMemberDto {
        return WorkspaceMemberDto(
            id = member.id!!,
            user = userService.toDto(member.user),
            role = member.role,
            joinedAt = member.joinedAt.toString()
        )
    }
}
