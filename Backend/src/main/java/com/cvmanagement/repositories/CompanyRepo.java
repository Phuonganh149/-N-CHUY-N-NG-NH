package com.cvmanagement.repositories;

import com.cvmanagement.entities.Company;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.mappers.mapCompany;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.StringJoiner;

import static com.cvmanagement.enums.DBSchema.Companies.*;

@Repository
public class CompanyRepo implements CrudRepoInterface<Company, Integer> {
    private DataSource dataSource;

    public CompanyRepo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void create(Company object) throws Exception {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "INSERT INTO companies(" + COMPANY_ID.value() + "," + NAME.value() + "," + SLUG.value() + "," + INDUSTRY.value() + "," + LOCATION.value() + "," + PLAN + "," + STATUS + "," + CREATED_AT.value() + "," + UPDATED_AT.value() + "," + VERIFIED_AT.value() + "," + REJECTED_REASON + ") VALUES (?,?,?,?,?,?,?,?,?,?,?)"
             );) {
            stmt.setString(1, object.getName());
            stmt.setString(2, object.getSlug());
            stmt.setString(3, object.getIndustry());
            stmt.setString(4, object.getLocation().toString());
            stmt.setString(5, object.getPlan());
            stmt.setString(6, object.getStatus().toString());
            stmt.setTimestamp(7, Timestamp.from(object.getCreatedAt()));
            stmt.setTimestamp(8, Timestamp.from(object.getUpdatedAt()));
            stmt.setTimestamp(9, Timestamp.from(object.getVerifiedAt()));
            stmt.setString(10, object.getRejectedReason());
            if (stmt.executeUpdate() == 0) throw new SQLException("không xác định");
        }
    }

    @Override
    public Company read(Integer id) throws Exception {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM companies WHERE " + COMPANY_ID.value() + "=?");) {
            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return mapCompany.map(rs);
            } else throw new BusinessException("không tồn tại dữ liệu");
        }
    }

    @Override
    public void update(Integer id, Company object, Set<String> modifyField) throws Exception {
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
            StringBuilder sql = new StringBuilder("UPDATE companies SET ");

            // Duyệt qua toàn bộ field cần update
            for (String field : modifyField) {
                if (field.equals(NAME.value())) {
                    fields.add(field + "=?");
                    params.add(object.getName());
                }

                if (field.equals(INDUSTRY.value())) {
                    fields.add(field + "=?");
                    params.add(object.getIndustry());
                }

                if (field.equals(LOCATION.value())) {
                    fields.add(field + "=?");
                    params.add(object.getLocation());
                }

                if (field.equals(PLAN.value())) {
                    fields.add(field + "=?");
                    params.add(object.getPlan());
                }

                if (field.equals(STATUS.value())) {
                    fields.add(field + "=?");
                    params.add(object.getStatus());
                }
            }

            // Tự động cập nhật thời gian chỉnh sửa cuối cùng
            fields.add(UPDATED_AT.value() + "=?");
            params.add(Timestamp.from(Instant.now()));

            // Ghép phần field update vào câu SQL và câu điều kiện USER_ID
            if (fields.length() >= 1) {
                sql.append(fields.toString());
                sql.append(" WHERE ").append(COMPANY_ID.value()).append("=?");
                params.add(id);

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


    @Override
    public void delete(Integer id) throws Exception {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("DELETE FROM companies WHERE " + COMPANY_ID.value() + " = ?");) {
            stmt.setObject(1, id);
            stmt.executeUpdate();
        }
    }
}
