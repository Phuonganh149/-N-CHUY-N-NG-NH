package com.cvmanagement.utilities;

import java.net.InetAddress;

public class TestDNS {
    public static void main(String[] args) {
        try {
            InetAddress[] addresses =
                    InetAddress.getAllByName(
                            "aws-1-ap-southeast-1.pooler.supabase.com"
                    );

            for (InetAddress a : addresses) {
                System.out.println(a);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}