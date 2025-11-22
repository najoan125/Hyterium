package kr.najoan.notionclone.repository

import kr.najoan.notionclone.entity.Block
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface BlockRepository : JpaRepository<Block, Long> {
    fun findAllByPageIdOrderByPosition(pageId: Long): List<Block>

    fun findAllByPageId(pageId: Long): List<Block>

    @Query("SELECT b FROM Block b WHERE b.parentBlock.id = :parentBlockId ORDER BY b.position")
    fun findAllByParentBlockIdOrderByPosition(parentBlockId: Long): List<Block>

    @Modifying
    @Query("DELETE FROM Block b WHERE b.page.id = :pageId AND b.clientId IN :clientIds")
    fun deleteByPageIdAndClientIdIn(@Param("pageId") pageId: Long, @Param("clientIds") clientIds: List<String>)
}
