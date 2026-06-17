package com.cvmanagement.repositories;

import com.cvmanagement.entities.applications;
import com.cvmanagement.mappers.mapApplications;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.StringJoiner;

import static com.cvmanagement.enums.DBSchema.Applications.*;

/**
 * Repository quản lý dữ liệu đơn ứng tuyển (Applications) trong database.
 * <p>
 * Cung cấp các phương thức CRUD:
 * <ul>
 * <li>Tạo đơn ứng tuyển mới</li>
 * <li>Lấy thông tin đơn ứng tuyển</li>
 * <li>Cập nhật đơn ứng tuyển</li>
 * <li>Xóa đơn ứng tuyển</li>
 * </ul>
 */
@Repository
public class ApplicationsRepo implements CrudRepoInterface<applications, Integer> {

    private DataSource dataSource;

    public ApplicationsRepo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    /**
     * Tạo đơn ứng tuyển mới trong database.
     *
     * @param newApplication object applications chứa thông tin đơn ứng tuyển mới
     * @throws SQLException khi xảy ra lỗi insert dữ liệu
     */
    public void create(applications newApplication) throws SQLException {
        Connection conn = dataSource.getConnection();
        PreparedStatement stmt = conn.prepareStatement("INSERT INTO applications(" + USER_ID.value() + "," + JOB_ID.value() + "," + CV_ID.value() + "," + STATUS.value() + "," + PIPELINE_STAGE.value() + "," + ADMIN_NOTE.value() + "," + APPLIED_AT.value() + "," + UPDATED_AT.value() + ") VALUES (?,?,?,?,?,?,?,?)");

        stmt.setObject(1, newApplication.getUserId());
        stmt.setInt(2, newApplication.getJobId());
        stmt.setInt(3, newApplication.getCvId());
        stmt.setString(4, newApplication.getStatus().toString());
        stmt.setString(5, newApplication.getStage().toString());
        stmt.setString(6, newApplication.getAdminNote());
        stmt.setTimestamp(7, Timestamp.from(newApplication.getAppliedAt()));
        stmt.setTimestamp(8, Timestamp.from(newApplication.getUpdatedAt()));

        if (stmt.executeUpdate() == 0) throw new SQLException("không xác định");
    }

    @Override
    /**
     * Lấy thông tin đơn ứng tuyển theo ID.
     *
     * @param id ID của đơn ứng tuyển
     * @return applications chứa thông tin đơn ứng tuyển
     * @throws SQLException khi xảy ra lỗi truy vấn
     * @throws Exception khi dữ liệu không tồn tại
     */
    public applications read(Integer id) throws SQLException, Exception {
        Connection conn = dataSource.getConnection();
        PreparedStatement stmt = conn.prepareStatement("SELECT * FROM applications WHERE " + APPLICATION_ID.value() + "=?");
        stmt.setInt(1, id);
        ResultSet rs = stmt.executeQuery();
        if (rs.next()) {
            return mapApplications.map(rs);
        } else throw new Exception("dữ liệu không tồn tại");
    }

    @Override
    /**
     * Cập nhật thông tin đơn ứng tuyển.
     *
     * @param id          ID của đơn ứng tuyển cần cập nhật
     * @param object      object applications chứa dữ liệu mới
     * @param modifyField tập hợp tên các field cần cập nhật
     * @throws SQLException khi xảy ra lỗi update dữ liệu
     */
    public void update(Integer id, applications object, Set<String> modifyField) throws SQLException {
        Connection connection = dataSource.getConnection();
        if (modifyField == null || modifyField.isEmpty()) {
            return;
        }

        StringJoiner fields = new StringJoiner(", ");
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("UPDATE applications SET ");

        for (String field : modifyField) {
            if (field.equals(STATUS.value())) {
                fields.add(field + "=?");
                params.add(object.getStatus());
            }
            if (field.equals(PIPELINE_STAGE.value())) {
                fields.add(field + "=?");
                params.add(object.getStage());
            }
            if (field.equals(ADMIN_NOTE.value())) {
                fields.add(field + "=?");
                params.add(object.getAdminNote());
            }
        }
        if (fields.length() >= 1) {
            sql.append(fields.toString());
            sql.append(" WHERE ").append(APPLICATION_ID.value()).append("=?");
            params.add(id);

            PreparedStatement ps = connection.prepareStatement(sql.toString());

            for (int i = 0; i < params.size(); i++) {
                ps.setObject(
                        i + 1,
                        params.get(i)
                );
            }
            if (ps.executeUpdate() == 0) throw new SQLException("Lỗi không xác định");
            ps.close();
        } else return;
    }

    @Override
    /**
     * Xóa đơn ứng tuyển theo ID.
     *
     * @param id ID của đơn ứng tuyển cần xóa
     * @throws SQLException khi xảy ra lỗi delete dữ liệu
     */
    public void delete(Integer id) throws SQLException {
        Connection conn = dataSource.getConnection();
        PreparedStatement stmt = conn.prepareStatement("DELETE FROM applications WHERE " + APPLICATION_ID.value() + "=?");
        stmt.setInt(1, id);
        if (stmt.executeUpdate() == 0) throw new SQLException("lỗi không xác định");
    }

    public boolean isExits(int applicationId) throws SQLException {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM applications WHERE " + APPLICATION_ID.value() + "=?");) {
            stmt.setInt(1, applicationId);
            return stmt.executeQuery().first();
        }
    }
}
