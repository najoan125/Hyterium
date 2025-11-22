package kr.najoan.notionclone.repository

import kr.najoan.notionclone.entity.Block
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface BlockRepository : JpaRepository<Block, Long> {
    fun findAllByPageIdOrderByPosition(pageId: Long): List<Block>

    @Query("SELECT b FROM Block b WHERE b.parentBlock.id = :parentBlockId ORDER BY b.position")
    fun findAllByParentBlockIdOrderByPosition(parentBlockId: Long): List<Block>

    fun deleteAllByPageId(pageId: Long)
}
