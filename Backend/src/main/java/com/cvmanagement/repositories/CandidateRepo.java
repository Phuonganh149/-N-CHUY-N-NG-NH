package com.cvmanagement.repositories;

import com.cvmanagement.entities.Candidate;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.mappers.mapUsers;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.time.Instant;
import java.util.*;

import static com.cvmanagement.enums.DBSchema.User.*;

@Repository
public class CandidateRepo implements CrudRepoInterface<Candidate, UUID> {
    private final DataSource dataSource;

    public CandidateRepo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Tạo mới dữ liệu ứng viên trong database.
     * Method này thực hiện:
     * <li>Kết nối tới database</li>
     * <li>Tạo câu lệnh INSERT cho bảng users</li>
     * <li>Gán dữ liệu từ object Candidate vào PreparedStatement</li>
     * <li>Thực thi câu lệnh insert dữ liệu</li>
     *
     * @param candidate chứa thông tin ứng viên cần tạo
     * @throws SQLException khi xảy ra lỗi thêm dữ liệu vào database
     */
    @Override
    public void create(Candidate candidate) throws SQLException {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "INSERT INTO users (" +
                             "" + USER_ID.value() + ", " +
                             "" + DISPLAY_CODE.value() + ", " +
                             "" + USERNAME.value() + ", " +
                             "" + ROLE.value() + ", " +
                             "" + FULLNAME.value() + ", " +
                             "" + EMAIL.value() + ", " +
                             "" + PHONE.value() + ", " +
                             "" + ADDRESS.value() + ", " +
                             "" + BIO.value() + ", " +
                             "" + STATUS.value() + ", " +
                             "" + PROVIDER.value() + ", " +
                             "" + PROVIDER_ID.value() + ", " +
                             "" + TWOFACTORENABLED.value() + ", " +
                             "" + AVATAR_URL.value() + ", " +
                             "" + CREATED_AT.value() + ", " +
                             "" + UPDATED_AT.value() + ") " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
             );) {
            stmt.setObject(1, candidate.getUserId());
            stmt.setString(2, candidate.getDisplayCode());
            stmt.setString(3, candidate.getUsername());
            stmt.setString(4, candidate.getRole().toString());
            stmt.setString(5, candidate.getFullName());
            stmt.setString(6, candidate.getEmail().toLowerCase());
            stmt.setString(7, candidate.getPhone());
            stmt.setString(8, candidate.getAddress());
            stmt.setString(9, candidate.getBio());
            stmt.setString(10, candidate.getStatus().toString());
            stmt.setString(11, candidate.getProvider().toString());
            stmt.setString(12, candidate.getProviderId());
            stmt.setBoolean(13, candidate.isTwoFactorEnabled());
            stmt.setString(14, candidate.getAvatarUrl());
            stmt.setTimestamp(15, Timestamp.from(candidate.getCreatedAt()));
            stmt.setTimestamp(16, Timestamp.from(candidate.getUpdatedAt()));

            if (stmt.executeUpdate() == 0) throw new SQLException("Không xác định");
        }
    }

//    @Override
//    public Candidate read(String displayCode) throws SQLException {
//        Connection conn = dataSource.getConnection();
//        PreparedStatement stmt = conn.prepareStatement("SELECT * from users where " + DISPLAY_CODE.value() + " = ?");
//        stmt.setString(1, displayCode);
//        ResultSet rs = stmt.executeQuery();
//        if (rs.next()) {
//            return (Candidate) mapUsers.map(rs);
//        } else {
//            throw new SQLException("User không tồn tại");
//        }
//    }

    /**
     * Lấy thông tin ứng viên dựa trên userId.
     * Method này thực hiện:
     * <li>Kết nối tới database</li>
     * <li>Truy vấn bảng users bằng userId</li>
     * <li>Mapping dữ liệu ResultSet sang object Candidate</li>
     *
     * @param userId id của ứng viên cần truy vấn
     * @return Candidate chứa thông tin ứng viên
     * @throws SQLException khi ứng viên không tồn tại hoặc xảy ra lỗi truy vấn
     */
    @Override
    public Candidate read(UUID userId) throws Exception {
        Connection conn = dataSource.getConnection();
        PreparedStatement stmt = conn.prepareStatement("SELECT * from users where " + USER_ID.value() + " = ?");
        stmt.setObject(1, userId);
        ResultSet rs = stmt.executeQuery();
        if (rs.next()) {
            return mapUsers.mapCandidate(rs);
        } else {
            throw new BusinessException("User không tồn tại");
        }
    }

    /**
     * Cập nhật thông tin ứng viên trong database.
     * Method này thực hiện:
     * <li>Kiểm tra danh sách field cần cập nhật</li>
     * <li>Dynamic build câu lệnh SQL UPDATE</li>
     * <li>Gán dữ liệu mới vào PreparedStatement</li>
     * <li>Cập nhật UPDATED_AT bằng thời gian hiện tại</li>
     * <li>Thực thi câu lệnh update dữ liệu</li>
     *
     * @param userId      id của ứng viên cần cập nhật
     * @param newVal      chứa dữ liệu mới của ứng viên
     * @param modifyField danh sách field cần cập nhật
     * @throws SQLException khi xảy ra lỗi cập nhật dữ liệu
     */
    @Override
    public void update(UUID userId, Candidate newVal, Set<String> modifyField) throws SQLException {
        // Tạo kết nối tới database
        try (Connection connection = dataSource.getConnection();) {
            // Nếu không có field nào cần update thì kết thúc method
            if (modifyField == null || modifyField.isEmpty()) {
                return;
            }

            // Dùng để nối các field update trong câu SQL
            StringJoiner fields = new StringJoiner(", ");

            // Danh sách parameter sẽ truyền vào PreparedStatement
            List<Object> params = new ArrayList<>();

            // Khởi tạo câu lệnh UPDATE cơ bản
            StringBuilder sql = new StringBuilder("UPDATE users SET ");

            // Duyệt qua toàn bộ field cần update
            for (String field : modifyField) {
                if (field.equals(FULLNAME.value())) {
                    fields.add(field + "=?");
                    params.add(newVal.getFullName());
                }

                if (field.equals(USERNAME.value())) {
                    fields.add(field + "=?");
                    params.add(newVal.getUsername());
                }

                if (field.equals(BIO.value())) {
                    fields.add(field + "=?");
                    params.add(newVal.getBio());
                }

                if (field.equals(AVATAR_URL.value())) {
                    fields.add(field + "=?");
                    params.add(newVal.getAvatarUrl());
                }

                if (field.equals(ADDRESS.value())) {
                    fields.add(field + "=?");
                    params.add(newVal.getAddress());
                }

                if (field.equals(PHONE.value())) {
                    fields.add(field + "=?");
                    params.add(newVal.getPhone());
                }

                if (field.equals(TWOFACTORENABLED.value())) {
                    fields.add(field + "=?");
                    params.add(newVal.isTwoFactorEnabled());
                }
            }

            // Tự động cập nhật thời gian chỉnh sửa cuối cùng
            fields.add(UPDATED_AT.value() + "=?");
            params.add(Timestamp.from(Instant.now()));

            // Ghép phần field update vào câu SQL và câu điều kiện USER_ID
            if (fields.length() >= 1) {
                sql.append(fields.toString());
                sql.append(" WHERE ").append(USER_ID.value()).append("=?");
                params.add(userId);

                // Tạo PreparedStatement từ câu SQL hoàn chỉnh
                PreparedStatement ps = connection.prepareStatement(sql.toString());

                // Gán toàn bộ parameter vào PreparedStatement
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(
                            i + 1,
                            params.get(i)
                    );
                }

                // Thực thi update, nếu không có dòng nào bị ảnh hưởng thì throw exception
                if (ps.executeUpdate() == 0) throw new SQLException("Lỗi không xác định");
            } else return;
        }
    }

    /**
     * Xóa dữ liệu ứng viên khỏi database dựa trên userId.
     * Method này thực hiện:
     * <li>Kết nối tới database</li>
     * <li>Thực thi câu lệnh DELETE trên bảng users</li>
     *
     * @param userId id của ứng viên cần xóa
     * @throws SQLException khi xảy ra lỗi xóa dữ liệu
     */
    @Override
    public void delete(UUID userId) throws SQLException {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("DELETE FROM users WHERE " + USER_ID.value() + " = ?");) {
            stmt.setObject(1, userId);
            stmt.executeUpdate();
        }
    }
}
