package com.cvmanagement;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DB {
    private final String url = "jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
    private final String user = "postgres.epraxnrelddtxyiteoyr";
    private final String password = "XuanNghia8102004!";
    private Connection conn = null;

    protected DB() {
        try {
            this.conn = DriverManager.getConnection(url, user, password);
            // TODO: Replace System.out.println with a proper logging framework
            System.out.println("Kết nối CSDL thành công");
        }catch(SQLException e){
            // TODO: Replace System.out.println with a proper logging framework
            System.out.println("Lỗi khi thử kết nối tới sql, lý do: "+e.getMessage());
        }
    }
    protected Connection getConn(){
        return this.conn;
    }
}
