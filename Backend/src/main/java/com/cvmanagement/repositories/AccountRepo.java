package com.cvmanagement.repositories;

import com.cvmanagement.entities.Account;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.mappers.mapUsers;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.User.*;

@Repository
public class AccountRepo {
    private final DataSource dataSource;

    public AccountRepo(DataSource dataSource) {
        this.dataSource = dataSource;
    }


    /**
     * Lấy thông tin tài khoản dựa trên userId.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kết nối tới database</li>
     * <li>Truy vấn bảng users bằng userId</li>
     * <li>Mapping dữ liệu ResultSet sang object Account</li>
     * </ul>
     *
     * @param userId id của tài khoản cần tìm
     * @return Account chứa thông tin tài khoản tương ứng
     * @throws BusinessException khi tài khoản không tồn tại
     * @throws SQLException      khi xảy ra lỗi truy vấn database
     */
    public Account get(UUID userId) throws SQLException {
        String sql = "SELECT * FROM users WHERE " + USER_ID.value() + " = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setObject(1, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapUsers.mapAccount(rs);
                }
            }
        }

        throw new BusinessException("tài khoản không tồn tại");
    }

    /**
     * Lấy thông tin tài khoản dựa trên email.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kết nối tới database</li>
     * <li>Truy vấn bảng users bằng email</li>
     * <li>Mapping dữ liệu ResultSet sang object Account</li>
     * </ul>
     *
     * @param email email của tài khoản cần tìm
     * @return Account chứa thông tin tài khoản tương ứng
     * @throws BusinessException khi tài khoản không tồn tại
     * @throws SQLException      khi xảy ra lỗi truy vấn database
     */
    public Account get(String email) throws SQLException {
        String sql = "SELECT * FROM users WHERE " + EMAIL.value() + " = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapUsers.mapAccount(rs);
                }
            }
        }

        throw new BusinessException("tài khoản không tồn tại");
    }

    /**
     * Kiểm tra tài khoản đã tồn tại dựa trên email hoặc số điện thoại.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kết nối tới database</li>
     * <li>Kiểm tra email hoặc phone đã tồn tại trong bảng users hay chưa</li>
     * </ul>
     *
     * @param email email cần kiểm tra
     * @param phone số điện thoại cần kiểm tra
     * @return true nếu tài khoản đã tồn tại, ngược lại trả về false
     * @throws SQLException khi xảy ra lỗi truy vấn database
     */
    public boolean isExits(String email, String phone) throws SQLException {
        String sql = "SELECT * FROM users WHERE " + EMAIL.value() + " = ? OR " + PHONE.value() + " = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.toLowerCase());
            stmt.setString(2, phone);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }


    /**
     * Kiểm tra tài khoản đã tồn tại dựa trên email.
     * Method này thực hiện:
     * <li>Kết nối tới database</li>
     * <li>Kiểm tra email đã tồn tại trong bảng users hay chưa</li>
     *
     * @param email email cần kiểm tra
     * @return true nếu tài khoản đã tồn tại, ngược lại trả về false
     * @throws SQLException khi xảy ra lỗi truy vấn database
     */
    public boolean isExits(String email) throws SQLException {
        String sql = "SELECT * FROM users WHERE " + EMAIL.value() + " = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.toLowerCase());

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }
}

