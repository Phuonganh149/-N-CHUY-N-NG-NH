package com.cvmanagement.repositories;

import com.cvmanagement.entities.Job;
import com.cvmanagement.mappers.mapJobs;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.StringJoiner;

import static com.cvmanagement.enums.DBSchema.Cv.ID;
import static com.cvmanagement.enums.DBSchema.Jobs.*;

/**
 * Repository quản lý dữ liệu bài tuyển dụng (Jobs) trong database.
 * <p>
 * Cung cấp các phương thức CRUD:
 * <ul>
 * <li>Tạo bài tuyển dụng mới</li>
 * <li>Lấy thông tin bài tuyển dụng</li>
 * <li>Cập nhật bài tuyển dụng</li>
 * <li>Xóa bài tuyển dụng</li>
 * <li>Tăng số lượng ứng tuyển</li>
 * </ul>
 */
@Repository
public class JobRepo implements CrudRepoInterface<Job, Integer> {
    private final DataSource dataSource;

    public JobRepo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    /**
     * Tạo bài tuyển dụng mới trong database.
     *
     * @param object Job object chứa thông tin bài tuyển dụng mới
     * @throws SQLException khi xảy ra lỗi insert dữ liệu
     */
    public void create(Job object) throws SQLException {
        Connection conn = dataSource.getConnection();
        PreparedStatement stmt = mapJobs.map(conn, object);
        if (stmt.executeUpdate() == 0) throw new SQLException("không xác định");
    }

    @Override
    /**
     * Lấy thông tin bài tuyển dụng theo ID.
     *
     * @param id ID của bài tuyển dụng
     * @return Job object chứa thông tin bài tuyển dụng
     * @throws Exception khi xảy ra lỗi truy vấn
     */
    public Job read(Integer id) throws Exception {
        Connection conn = dataSource.getConnection();
        PreparedStatement stmt = conn.prepareStatement("SELECT * FROM jobs WHERE " + JOB_ID.value() + " =?");
        stmt.setInt(1, id);
        return mapJobs.map(stmt.executeQuery());
    }

    @Override
    /**
     * Cập nhật thông tin bài tuyển dụng.
     *
     * @param id          ID của bài tuyển dụng cần cập nhật
     * @param object      Job object chứa dữ liệu mới
     * @param modifyField tập hợp tên các field cần cập nhật
     * @throws SQLException khi xảy ra lỗi update dữ liệu
     */
    public void update(Integer id, Job object, Set<String> modifyField) throws SQLException {
        Connection connection = dataSource.getConnection();
        if (modifyField == null || modifyField.isEmpty()) {
            return;
        }

        StringJoiner fields = new StringJoiner(", ");
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("UPDATE applications SET ");
        for (String field : modifyField) {
            if (field.equals(TITLE.value())) {
                fields.add(field + "=?");
                params.add(object.getTitle());
            }
            if (field.equals(DEADLINE.value())) {
                fields.add(field + "=?");
                params.add(object.getDeadline());
            }
        }
        if (fields.length() >= 1) {
            sql.append(fields.toString());
            sql.append(" WHERE ").append(JOB_ID.value()).append("=?");
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
     * Xóa bài tuyển dụng theo ID.
     *
     * @param id ID của bài tuyển dụng cần xóa
     * @throws SQLException khi xảy ra lỗi delete dữ liệu
     */
    public void delete(Integer id) throws SQLException {
        Connection conn = dataSource.getConnection();
        PreparedStatement stmt = conn.prepareStatement("DELETE FROM jobs WHERE " + JOB_ID.value() + "=?");
        stmt.setInt(1, id);
        if (stmt.executeUpdate() == 0) throw new SQLException("lỗi không xác định");
        conn.close();
    }

    /**
     * Tăng số lượng ứng tuyển của bài tuyển dụng.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Lấy số lượng hiện tại</li>
     * <li>Tăng số lượng lên 1</li>
     * <li>Cập nhật vào database</li>
     * </ul>
     *
     * @param jobId ID của bài tuyển dụng
     * @throws SQLException khi xảy ra lỗi database
     */
    public void IncreseQuantity(int jobId) throws SQLException {
        Connection conn = dataSource.getConnection();
        PreparedStatement getOldQuantity = conn.prepareStatement("SELECT quantity FROM jobs WHERE " + ID.value() + "=?");
        getOldQuantity.setInt(1, jobId);
        int oldQuantity = getOldQuantity.executeQuery().getInt(QUANTITY.value());
        PreparedStatement updateQuantity = conn.prepareStatement("UPDATE jobs SET " + QUANTITY.value() + " =? WHERE " + JOB_ID.value() + "=?");
        updateQuantity.setInt(1, oldQuantity + 1);
        updateQuantity.setInt(2, jobId);
        if (updateQuantity.executeUpdate() == 0) throw new SQLException("lỗi không xác định");
    }
}
