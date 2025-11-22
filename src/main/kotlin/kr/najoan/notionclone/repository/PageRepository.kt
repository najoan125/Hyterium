package kr.najoan.notionclone.repository

import kr.najoan.notionclone.entity.Page
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface PageRepository : JpaRepository<Page, Long> {
    fun findAllByWorkspaceIdAndIsDeleted(workspaceId: Long, isDeleted: Boolean = false): List<Page>
    fun findAllByWorkspaceIdAndParentPageIsNullAndIsDeleted(
        workspaceId: Long,
        isDeleted: Boolean = false
    ): List<Page>

    @Query("SELECT p FROM Page p WHERE p.parentPage.id = :parentPageId AND p.isDeleted = :isDeleted")
    fun findAllByParentPageIdAndIsDeleted(parentPageId: Long, isDeleted: Boolean = false): List<Page>
}
