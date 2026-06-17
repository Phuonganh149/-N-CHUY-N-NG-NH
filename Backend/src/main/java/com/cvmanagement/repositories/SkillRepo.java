package com.cvmanagement.repositories;

import com.cvmanagement.entities.Skill;
import com.cvmanagement.exceptions.BusinessException;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.StringJoiner;

import static com.cvmanagement.enums.DBSchema.Skills.*;

/**
 * Repository quản lý dữ liệu kỹ năng (Skills) trong database.
 * <p>
 * Cung cấp các phương thức CRUD:
 * <ul>
 * <li>Tạo kỹ năng mới</li>
 * <li>Lấy thông tin kỹ năng</li>
 * <li>Cập nhật kỹ năng</li>
 * <li>Xóa kỹ năng</li>
 * </ul>
 */
@Repository
public class SkillRepo implements CrudRepoInterface<Skill, Integer> {
    private final DataSource dataSource;

    public SkillRepo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    /**
     * Tạo kỹ năng mới trong database.
     *
     * @param newSKill Skill object chứa thông tin kỹ năng mới
     * @throws SQLException khi xảy ra lỗi insert dữ liệu
     */
    public void create(Skill newSKill) throws SQLException {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("INSERT INTO skills (" + SKILL_NAME.value() + ", " + CREATED_AT.value() + ") VALUES (?,?)");
        ) {
            stmt.setString(1, newSKill.getName());
            stmt.setTimestamp(2, Timestamp.from(newSKill.getCreatedAt()));
            if (stmt.executeUpdate() == 0) throw new SQLException("lỗi không xác định");
        }
    }

    @Override
    /**
     * Lấy thông tin kỹ năng theo ID.
     *
     * @param id ID của kỹ năng
     * @return Skill object chứa thông tin kỹ năng
     * @throws Exception khi kỹ năng không tồn tại hoặc lỗi database
     */
    public Skill read(Integer id) throws Exception {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM skills WHERE " + SKILL_ID + "=?");
        ) {
            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();
            if (rs.first()) {
                return new Skill(rs.getInt(SKILL_ID.value()), rs.getString(SKILL_NAME.value()), rs.getTimestamp(CREATED_AT.value()).toInstant());
            } else {
                throw new BusinessException("không tồn tại kỹ năng này");
            }
        }
    }

    @Override
    /**
     * Cập nhật thông tin kỹ năng.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Xác định các field cần cập nhật</li>
     * <li>Xây dựng câu lệnh UPDATE với các field tương ứng</li>
     * <li>Cập nhật dữ liệu vào database</li>
     * </ul>
     *
     * @param id                      ID của kỹ năng cần cập nhật
     * @param skillObjectWithNewVal   Skill object chứa dữ liệu mới
     * @param modifyField             tập hợp tên các field cần cập nhật
     * @throws SQLException khi xảy ra lỗi update dữ liệu
     */
    public void update(Integer id, Skill skillObjectWithNewVal, Set<String> modifyField) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            // Dùng để nối các field update trong câu SQL
            StringJoiner fields = new StringJoiner(", ");

            // Danh sách parameter sẽ truyền vào PreparedStatement
            List<Object> params = new ArrayList<>();

            // Khởi tạo câu lệnh UPDATE cơ bản
            StringBuilder sql = new StringBuilder("UPDATE skills SET ");

            // Duyệt qua toàn bộ field cần update
            for (String field : modifyField) {
                if (field.equals(SKILL_NAME.value())) {
                    fields.add(field + "=?");
                    params.add(skillObjectWithNewVal.getName());
                }
            }

            // Ghép phần field update vào câu SQL và câu điều kiện USER_ID
            if (fields.length() >= 1) {
                sql.append(fields.toString());
                sql.append(" WHERE ").append(SKILL_ID.value()).append("=?");
                params.add(id);

                // Tạo PreparedStatement từ câu SQL hoàn chỉnh
                PreparedStatement ps = conn.prepareStatement(sql.toString());

                // Gán toàn bộ parameter vào PreparedStatement
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(
                            i + 1,
                            params.get(i)
                    );
                }

                // Thực thi update, nếu không có dòng nào bị ảnh hưởng thì throw exception
                if (ps.executeUpdate() == 0) throw new SQLException("lỗi không xác định");
                ps.close();
            } else return;
        }


    }

    @Override
    /**
     * Xóa kỹ năng theo ID.
     *
     * @param id ID của kỹ năng cần xóa
     * @throws SQLException khi xảy ra lỗi delete dữ liệu
     */
    public void delete(Integer id) throws SQLException {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("DELETE FROM skills WHERE " + SKILL_ID + "=?");
        ) {
            stmt.setInt(1, id);
            if (stmt.executeUpdate() == 0) {
                throw new BusinessException("kỹ năng không tồn tại hoặc lỗi không xác định");
            }
        }
    }
}
