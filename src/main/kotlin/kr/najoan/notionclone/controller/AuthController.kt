package kr.najoan.notionclone.controller

import kr.najoan.notionclone.dto.UserDto
import kr.najoan.notionclone.security.UserPrincipal
import kr.najoan.notionclone.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val userService: UserService
) {

    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal userPrincipal: UserPrincipal): ResponseEntity<UserDto> {
        val userDto = userService.toDto(userPrincipal.user)
        return ResponseEntity.ok(userDto)
    }
}
