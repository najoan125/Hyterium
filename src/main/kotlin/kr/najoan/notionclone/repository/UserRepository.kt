package kr.najoan.notionclone.repository

import kr.najoan.notionclone.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByDiscordId(discordId: String): Optional<User>
    fun findByEmail(email: String): Optional<User>
    fun existsByDiscordId(discordId: String): Boolean
    fun existsByEmail(email: String): Boolean
}
