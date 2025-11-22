package kr.najoan.notionclone.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import kr.najoan.notionclone.service.UserService
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder

@Component
class OAuth2AuthenticationSuccessHandler(
    private val jwtUtils: JwtUtils,
    private val userService: UserService,
    @Value("\${base.url}")
    private val baseUrl: String
) : SimpleUrlAuthenticationSuccessHandler() {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oAuth2User = authentication.principal as OAuth2User

        val discordId = oAuth2User.getAttribute<String>("id")!!
        val username = oAuth2User.getAttribute<String>("username")!!
        val discriminator = oAuth2User.getAttribute<String>("discriminator") ?: "0"
        val email = oAuth2User.getAttribute<String>("email")!!
        val avatar = oAuth2User.getAttribute<String>("avatar")
        val avatarUrl = if (avatar != null) {
            "https://cdn.discordapp.com/avatars/$discordId/$avatar.png"
        } else null

        val user = userService.createOrUpdateUser(
            discordId = discordId,
            username = if (discriminator != "0") "$username#$discriminator" else username,
            email = email,
            avatarUrl = avatarUrl
        )

        val token = jwtUtils.generateToken(user.id!!, user.discordId, user.email)

        val targetUrl = UriComponentsBuilder.fromUriString(baseUrl)
            .path("/auth/callback")
            .queryParam("token", token)
            .build()
            .toUriString()

        redirectStrategy.sendRedirect(request, response, targetUrl)
    }
}
