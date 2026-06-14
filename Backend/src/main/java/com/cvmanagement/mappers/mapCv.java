package com.cvmanagement.mappers;

import com.cvmanagement.entities.CV;
import com.cvmanagement.enums.DBSchema.Cv;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.StringJoiner;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.Cv.*;

public class mapCv {
    public static CV map(ResultSet rs) throws SQLException {
        if (rs.next()) {
            return new CV(
                    rs.getInt(ID.value()),
                    (UUID) rs.getObject(USER_ID.value()),
                    rs.getString(STORAGE_PATH.value()),
                    rs.getString(FILE_URL.value()),
                    rs.getString(FILE_NAME.value()),
                    rs.getString(MIME_TYPE.value()),
                    rs.getInt(FILE_SIZE.value()),
                    rs.getTimestamp(UPDATED_AT.value()).toLocalDateTime(),
                    rs.getBoolean(IS_PRIMARY.value()),
                    rs.getString(AI_ANALYSIS.value()),
                    rs.getTimestamp(CREATED_AT.value()).toLocalDateTime()
            );
        } else throw new SQLException("dữ liệu không tồn tại");
    }

    public static String mapInsert() {
        StringJoiner columns = new StringJoiner(", ");
        StringJoiner placeholders = new StringJoiner(", ");

        for (Cv elem : Cv.values()) {
            columns.add(elem.value());
            placeholders.add("?");
        }

        return """
                INSERT INTO cvs (%s)
                VALUES (%s)
                """.formatted(columns, placeholders);
    }
}
