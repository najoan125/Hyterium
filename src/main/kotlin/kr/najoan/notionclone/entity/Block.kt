package kr.najoan.notionclone.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "blocks",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_block_page_client", columnNames = ["page_id", "client_id"])
    ]
)
data class Block(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "client_id", updatable = false)
    val clientId: String?,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "page_id", nullable = false)
    val page: Page,

    @Column(nullable = false)
    var type: String,

    @Column(columnDefinition = "TEXT")
    var content: String? = null,

    @Column(columnDefinition = "TEXT")
    var properties: String? = null,

    @Column(nullable = false)
    var position: Int = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_block_id")
    var parentBlock: Block? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "parentBlock", cascade = [CascadeType.ALL])
    val childBlocks: MutableList<Block> = mutableListOf()
)
