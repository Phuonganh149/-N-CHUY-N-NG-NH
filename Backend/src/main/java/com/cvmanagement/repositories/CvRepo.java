package com.cvmanagement.repositories;

import com.cvmanagement.entities.CV;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.mappers.mapCv;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.Cv.IS_PRIMARY;
import static com.cvmanagement.enums.DBSchema.Cv.USER_ID;

/**
 * Repository quản lý dữ liệu CV (Curriculum Vitae) của người dùng.
 * <p>
 * Cung cấp các hàm:
 * <ul>
 * <li>Lấy CV chính của người dùng</li>
 * </ul>
 */
@Repository
public class CvRepo {
    private DataSource dataSource;

    public CvRepo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Lấy CV chính (primary) của người dùng.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kết nối tới database</li>
     * <li>Truy vấn CV có is_primary=true tương ứng với userId</li>
     * <li>Mapping dữ liệu sang object CV</li>
     * </ul>
     *
     * @param userId ID của người dùng
     * @return CV object chứa thông tin CV chính
     * @throws SQLException khi xảy ra lỗi truy vấn database
     */
    public CV getPrimary(UUID userId) throws SQLException {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM cvs WHERE " + USER_ID.value() + "=? AND " + IS_PRIMARY.value() + "=true");) {
            stmt.setObject(1, userId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return mapCv.map(rs);
            else throw new BusinessException("không có primary cv");
        }
    }
}
