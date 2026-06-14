package com.cvmanagement.mappers;

import com.cvmanagement.entities.applications;
import com.cvmanagement.enums.ApplicationStatus;
import com.cvmanagement.enums.DBSchema.Applications;
import com.cvmanagement.enums.PipelineStage;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.StringJoiner;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.Applications.*;

public class mapApplications {
    public static String mapInsert() {
        StringJoiner columns = new StringJoiner(", ");
        StringJoiner placeholders = new StringJoiner(", ");

        for (Applications elem : Applications.values()) {
            if (elem == APPLICATION_ID) continue;
            columns.add(elem.value());
            placeholders.add("?");
        }

        return """
                INSERT INTO cvs (%s)
                VALUES (%s)
                """.formatted(columns, placeholders);
    }

    public static applications map(ResultSet rs) throws SQLException {
        return new applications(
                rs.getInt(APPLICATION_ID.value()),
                (UUID) rs.getObject(USER_ID.value()),
                rs.getInt(JOB_ID.value()),
                rs.getInt(CV_ID.value()),
                ApplicationStatus.valueOf(rs.getString(STATUS.value())),
                PipelineStage.valueOf(rs.getString(PIPELINE_STAGE.value())),
                rs.getString(ADMIN_NOTE.value()),
                rs.getTimestamp(APPLIED_AT.value()).toInstant(),
                rs.getTimestamp(UPDATED_AT.value()).toInstant()
        );
    }

}
