package kr.najoan.notionclone.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.util.*
import javax.crypto.SecretKey

@Component
class JwtUtils(
    @Value("\${jwt.secret}")
    private val secret: String,

    @Value("\${jwt.expiration}")
    private val expiration: Long
) {
    private val logger = LoggerFactory.getLogger(JwtUtils::class.java)
    private fun getSigningKey(): SecretKey {
        val keyBytes = secret.toByteArray(StandardCharsets.UTF_8)
        return Keys.hmacShaKeyFor(keyBytes)
    }

    fun generateToken(userId: Long, discordId: String, email: String): String {
        val now = Date()
        val expiryDate = Date(now.time + expiration)

        return Jwts.builder()
            .subject(userId.toString())
            .claim("discordId", discordId)
            .claim("email", email)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey())
            .compact()
    }

    fun getUserIdFromToken(token: String): Long {
        val claims = getAllClaimsFromToken(token)
        return claims.subject.toLong()
    }

    fun getDiscordIdFromToken(token: String): String {
        val claims = getAllClaimsFromToken(token)
        return claims["discordId"] as String
    }

    fun validateToken(token: String): Boolean {
        return try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
            logger.info("Token validation successful")
            true
        } catch (e: Exception) {
            logger.error("Token validation failed: ${e::class.simpleName} - ${e.message}")
            false
        }
    }

    private fun getAllClaimsFromToken(token: String): Claims {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
