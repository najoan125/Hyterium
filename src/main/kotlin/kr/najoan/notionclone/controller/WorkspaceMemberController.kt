package kr.najoan.notionclone.controller

import kr.najoan.notionclone.dto.UpdateMemberRoleRequest
import kr.najoan.notionclone.dto.WorkspaceMemberDto
import kr.najoan.notionclone.security.UserPrincipal
import kr.najoan.notionclone.service.WorkspaceMemberService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/members")
class WorkspaceMemberController(
    private val workspaceMemberService: WorkspaceMemberService
) {

    @GetMapping
    fun getWorkspaceMembers(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<List<WorkspaceMemberDto>> {
        val members = workspaceMemberService.getWorkspaceMembers(workspaceId, userPrincipal.user.id!!)
        return ResponseEntity.ok(members)
    }

    @PutMapping("/{memberId}/role")
    fun updateMemberRole(
        @PathVariable workspaceId: Long,
        @PathVariable memberId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody request: UpdateMemberRoleRequest
    ): ResponseEntity<WorkspaceMemberDto> {
        val member = workspaceMemberService.updateMemberRole(
            workspaceId,
            memberId,
            userPrincipal.user.id!!,
            request
        )
        return ResponseEntity.ok(member)
    }

    @DeleteMapping("/{memberId}")
    fun removeMember(
        @PathVariable workspaceId: Long,
        @PathVariable memberId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<Void> {
        workspaceMemberService.removeMember(workspaceId, memberId, userPrincipal.user.id!!)
        return ResponseEntity.noContent().build()
    }

    @DeleteMapping("/leave")
    fun leaveWorkspace(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<Void> {
        workspaceMemberService.leaveWorkspace(workspaceId, userPrincipal.user.id!!)
        return ResponseEntity.noContent().build()
    }
}
