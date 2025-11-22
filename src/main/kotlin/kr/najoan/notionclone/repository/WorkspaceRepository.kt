package kr.najoan.notionclone.repository

import kr.najoan.notionclone.entity.Workspace
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface WorkspaceRepository : JpaRepository<Workspace, Long> {
    @Query("SELECT w FROM Workspace w JOIN w.members m WHERE m.user.id = :userId")
    fun findAllByUserId(userId: Long): List<Workspace>

    fun findByOwnerId(ownerId: Long): List<Workspace>
}
