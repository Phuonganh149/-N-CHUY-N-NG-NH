package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.Subscription.SubscriptionPostRequest;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.services.CoreEntityService.SubscriptionService;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/subscription")
public class SupscriptionController {
    private SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<String> createSubscription(@RequestBody SubscriptionPostRequest request) {
        try {
            subscriptionService.create(request);
            return ResponseEntity.ok("Thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể tạo plan mới do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi máy chủ", HttpStatusCode.valueOf(500));
        }
    }

    @GetMapping("/{subscribtion_id}")
    public ResponseEntity<Object> getSubscription(@PathVariable int subscription_id) {
        try {
            return ResponseEntity.ok("Chưa hoàn thiện");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể lấy thông tin do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi máy chủ", HttpStatusCode.valueOf(500));
        }
    }

    @PatchMapping("/{subscription_id}")
    public ResponseEntity<String> updateSubscription(@PathVariable int subscription_id) {
        try {
            return ResponseEntity.ok("Chưa hoàn thiện");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể cập nhật plan do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi máy chủ", HttpStatusCode.valueOf(500));
        }
    }

    @DeleteMapping("/{subscription_id}")
    public ResponseEntity<String> deleteSubscription(@PathVariable int subscription_id) {
        try {
            return ResponseEntity.ok("Chưa hoàn thiện");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể xóa plan do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi máy chủ", HttpStatusCode.valueOf(500));
        }
    }
}
