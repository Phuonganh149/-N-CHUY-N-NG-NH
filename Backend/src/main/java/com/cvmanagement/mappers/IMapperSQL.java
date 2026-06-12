package com.cvmanagement.mappers;

import java.sql.ResultSet;

public interface IMapperSQL<T> {
    public default T map(ResultSet rs) throws Exception {
        return null;
    }

    public default String mapInsert(T input) throws Exception {
        return null;
    }

    public default String mapUpdate(T input) throws Exception {
        return null;
    }
}
