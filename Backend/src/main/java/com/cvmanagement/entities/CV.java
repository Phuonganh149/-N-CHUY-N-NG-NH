package com.cvmanagement.entities;

import java.time.LocalDateTime;
import java.util.UUID;

public class CV {
    private int CvId;
    private UUID userId;
    private String storagePath;
    private String fileUrl;
    private String fileName;
    private String mimeType;
    private int fileSize;
    private LocalDateTime updatedAt;
    private boolean isPrimary;
    private String aiAnalysis;
    private LocalDateTime createdAt;

    public CV(
            int cvId,
            UUID userId,
            String storagePath,
            String fileUrl,
            String fileName,
            String mimeType,
            int fileSize,
            LocalDateTime updatedAt,
            boolean isPrimary,
            String aiAnalysis,
            LocalDateTime createdAt) {
        CvId = cvId;
        this.userId = userId;
        this.storagePath = storagePath;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.updatedAt = updatedAt;
        this.isPrimary = isPrimary;
        this.aiAnalysis = aiAnalysis;
        this.createdAt = createdAt;
    }

    public int getCvId() {
        return CvId;
    }

    public void setCvId(int cvId) {
        CvId = cvId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public int getFileSize() {
        return fileSize;
    }

    public void setFileSize(int fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isPrimary() {
        return isPrimary;
    }

    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }

    public String getAiAnalysis() {
        return aiAnalysis;
    }

    public void setAiAnalysis(String aiAnalysis) {
        this.aiAnalysis = aiAnalysis;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
