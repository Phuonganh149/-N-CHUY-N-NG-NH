package com.cvmanagement.mappers;

import com.cvmanagement.entities.Job;
import com.cvmanagement.enums.CompanyLocation;
import com.cvmanagement.enums.DBSchema.Jobs;
import com.cvmanagement.enums.JobStatus;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.StringJoiner;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.Jobs.*;


public class mapJobs {
    public static PreparedStatement map(Connection conn, Job job) throws SQLException {
        StringJoiner collumns = new StringJoiner(", ");
        StringJoiner placeholder = new StringJoiner(", ");
        for (Jobs elem : Jobs.values()) {
            collumns.add(elem.value());
            placeholder.add(" ?");
        }
        PreparedStatement result = conn.prepareStatement("INSERT INTO jobs (" + collumns + ") VALUES (" + placeholder + ")");
        result.setInt(1, job.getId());
        result.setObject(2, (UUID) job.getUserId());
        result.setString(3, job.getTitle());
        result.setString(4, job.getCompany());
        result.setString(5, job.getLocation().toString());
        result.setString(6, job.getSalaryText());
        result.setBigDecimal(7, job.getSalaryMin());
        result.setBigDecimal(8, job.getSalaryMax());
        result.setString(9, job.getDepartment());
        result.setInt(10, job.getQuantity());
        result.setString(11, job.getDescription());
        result.setString(12, job.getRequirements());
        result.setString(13, job.getTags());
        result.setTimestamp(14, Timestamp.from(job.getDeadline()));
        result.setString(15, job.getStatus().toString());
        result.setBoolean(16, job.isActive());
        result.setTimestamp(17, Timestamp.from(job.getCreatedAt()));
        result.setTimestamp(18, Timestamp.from(job.getUpdatedAt()));
        return result;
    }

    public static Job map(ResultSet rs) throws Exception {
        if (rs.next()) {
            return new Job(
                    rs.getInt(JOB_ID.value()),
                    (UUID) rs.getObject(CREATED_BY.value()),
                    rs.getString(TITLE.value()),
                    rs.getString(COMPANY.value()),
                    CompanyLocation.valueOf(rs.getString(LOCATION.value())),
                    rs.getString(SALARY_TEXT.value()),
                    rs.getBigDecimal(SALARY_MIN.value()),
                    rs.getBigDecimal((SALARY_MAX.value())),
                    rs.getString(DEPARTMENT.value()),
                    rs.getInt(QUANTITY.value()),
                    rs.getString(DESCRIPTION.value()),
                    rs.getString(REQUIREMENS.value()),
                    new ArrayList<>(List.of(rs.getString(TAGS.value()).split(","))),
                    rs.getTimestamp(DEADLINE.value()).toInstant(),
                    JobStatus.valueOf(rs.getString(STATUS.value())),
                    rs.getBoolean(ACTIVE.value()),
                    rs.getTimestamp(CREATED_AT.value()).toInstant(),
                    rs.getTimestamp(UPDATED_AT.value()).toInstant()
            );
        } else {
            throw new Exception("không tồn tại dữ liệu");
        }
    }

    public static String mapInsert(Job newJob) throws Exception {
        // Tạo placeholder vào sql
        StringJoiner columns = new StringJoiner(", ");
        StringJoiner placeholders = new StringJoiner(", ");
//
//        //Lấy collumn từ Enums Jobs thêm vào sql
//        for (Jobs elem : Jobs.values()) {
//            columns.add(elem.value());
//        }
//
//        //
//        placeholders.add(newJob.getId());
//        place

        return """
                INSERT INTO jobs (%s)
                VALUES (%s)
                """.formatted(columns, placeholders);
    }

    public static String mapUpdate(Job job) throws Exception {
        return "";
    }
}
