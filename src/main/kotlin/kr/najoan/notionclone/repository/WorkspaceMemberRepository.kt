package kr.najoan.notionclone.repository

import kr.najoan.notionclone.entity.WorkspaceMember
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface WorkspaceMemberRepository : JpaRepository<WorkspaceMember, Long> {
    fun findByWorkspaceIdAndUserId(workspaceId: Long, userId: Long): Optional<WorkspaceMember>
    fun findAllByWorkspaceId(workspaceId: Long): List<WorkspaceMember>
    fun findAllByUserId(userId: Long): List<WorkspaceMember>
    fun existsByWorkspaceIdAndUserId(workspaceId: Long, userId: Long): Boolean
    fun deleteByWorkspaceIdAndUserId(workspaceId: Long, userId: Long)
}
