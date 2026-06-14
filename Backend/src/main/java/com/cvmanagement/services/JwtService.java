package com.cvmanagement.services;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;

/**
 * Service xử lý các nhân vụ liên quan đến JWT (JSON Web Token).
 * <p>
 * Cung cấp các hàm cho việc:
 * <ul>
 * <li>Tạo JWT token mới cho người dùng</li>
 * <li>Xác thực và lấy thông tin từ JWT token</li>
 * <li>Kiểm tra tính hợp lệ của token</li>
 * </ul>
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    /**
     * Tạo JWT token mới cho người dùng.
     * <p>
     * Token này có hạn sống là 24 giờ.
     *
     * @param username tên người dùng (thường là email)
     * @return chuỗi JWT token đã ký
     */
    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + 86400000
                        )
                )
                .signWith(getKey())
                .compact();
    }

    /**
     * Lấy username từ JWT token.
     *
     * @param token chuỗi JWT token
     * @return username được luậ của trong token
     */
    public String extractUsername(
            String token
    ) {
        return Jwts.parser()
                .verifyWith((SecretKey) getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Kiểm tra JWT token có hợp lệ và chưa hết hạn không.
     *
     * @param token chuỗi JWT token
     * @return true nếu token hợp lệ, false nếu không
     */
    public boolean isValid(String token) {
        try {
            Jwts.parser()
                    .verifyWith((SecretKey) getKey())
                    .build()
                    .parseSignedClaims(token);

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy secret key dùng cho JWT signing.
     *
     * @return HMAC secret key
     */
    private Key getKey() {
        return Keys.hmacShaKeyFor(
                secret.getBytes()
        );
    }
}