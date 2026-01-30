import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { 
  Files, 
  X, 
  FileText, 
  Image as ImageIcon,
  Trash2,
  Upload,
  Search,
  File,
  Camera,
  ImagePlus,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import type { AppFile, GeneratedImage, FileType } from '@/types';
import CopyButton from '@/components/CopyButton';

const FILE_TYPE_CONFIG = {
  txt: { icon: FileText, color: '#3b82f6', label: 'Text' },
  doc: { icon: FileText, color: '#2563eb', label: 'Document' },
  pdf: { icon: File, color: '#dc2626', label: 'PDF' },
  image: { icon: ImageIcon, color: '#10b981', label: 'Image' },
  other: { icon: File, color: '#64748b', label: 'Other' },
};

export default function FilesManagerScreen() {
  const insets = useSafeAreaInsets();
  const { state, addFile, deleteFile, deleteGeneratedImage } = useApp();
  const [activeTab, setActiveTab] = useState<'files' | 'images'>('files');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<AppFile | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showFileModal, setShowFileModal] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      const fileExtension = asset.name.split('.').pop()?.toLowerCase() || 'other';
      let fileType: FileType = 'other';
      
      if (['txt', 'text'].includes(fileExtension)) fileType = 'txt';
      else if (['doc', 'docx'].includes(fileExtension)) fileType = 'doc';
      else if (fileExtension === 'pdf') fileType = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) fileType = 'image';

      addFile({
        name: asset.name,
        type: fileType,
        uri: asset.uri,
        size: asset.size || 0,
        mimeType: asset.mimeType || 'application/octet-stream',
        tags: [],
      });

      Alert.alert('✓ File Added', `${asset.name} has been uploaded successfully`);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      const fileName = asset.uri.split('/').pop() || `image-${Date.now()}.jpg`;

      addFile({
        name: fileName,
        type: 'image',
        uri: asset.uri,
        size: asset.fileSize || 0,
        mimeType: 'image/jpeg',
        tags: ['uploaded'],
        thumbnail: asset.uri,
      });

      Alert.alert('✓ Image Added', 'Image uploaded successfully');
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      const fileName = `photo-${Date.now()}.jpg`;

      addFile({
        name: fileName,
        type: 'image',
        uri: asset.uri,
        size: asset.fileSize || 0,
        mimeType: 'image/jpeg',
        tags: ['photo'],
        thumbnail: asset.uri,
      });

      Alert.alert('✓ Photo Captured', 'Photo saved successfully');
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    Alert.alert('Delete File', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          deleteFile(fileId);
          setShowFileModal(false);
          setSelectedFile(null);
        } 
      },
    ]);
  };

  const handleDeleteImage = (imageId: string) => {
    Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          deleteGeneratedImage(imageId);
          setShowImageModal(false);
          setSelectedImage(null);
        } 
      },
    ]);
  };

  const filteredFiles = state.files.filter(file => 
    searchQuery.trim() === '' || 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredImages = state.generatedImages.filter(image =>
    searchQuery.trim() === '' ||
    image.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Files size={28} color="#0f172a" />
            <Text style={styles.headerTitle}>Files</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search files..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'files' && styles.tabActive]}
            onPress={() => setActiveTab('files')}
          >
            <FileText size={18} color={activeTab === 'files' ? '#6366f1' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'files' && styles.tabTextActive]}>
              Files ({state.files.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'images' && styles.tabActive]}
            onPress={() => setActiveTab('images')}
          >
            <ImageIcon size={18} color={activeTab === 'images' ? '#6366f1' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'images' && styles.tabTextActive]}>
              Images ({state.generatedImages.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'files' ? (
          <>
            <View style={styles.uploadSection}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Upload size={20} color="#ffffff" />
                <Text style={styles.uploadButtonText}>Upload File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <ImagePlus size={20} color="#ffffff" />
                <Text style={styles.uploadButtonText}>Add Image</Text>
              </TouchableOpacity>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                  <Camera size={20} color="#ffffff" />
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredFiles.length === 0 ? (
              <View style={styles.emptyState}>
                <Files size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No files yet</Text>
                <Text style={styles.emptyText}>Upload documents, images, or create files</Text>
              </View>
            ) : (
              <View style={styles.filesList}>
                {filteredFiles.map((file) => {
                  const config = FILE_TYPE_CONFIG[file.type] || FILE_TYPE_CONFIG.other;
                  const Icon = config.icon;
                  return (
                    <TouchableOpacity
                      key={file.id}
                      style={styles.fileCard}
                      onPress={() => {
                        setSelectedFile(file);
                        setShowFileModal(true);
                      }}
                    >
                      {file.type === 'image' && file.thumbnail ? (
                        <Image source={{ uri: file.thumbnail }} style={styles.fileImage} />
                      ) : (
                        <View style={[styles.fileIcon, { backgroundColor: config.color + '20' }]}>
                          <Icon size={24} color={config.color} />
                        </View>
                      )}
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
                        <View style={styles.fileMetaRow}>
                          <Text style={styles.fileType}>{config.label}</Text>
                          <Text style={styles.fileMeta}>• {formatFileSize(file.size)}</Text>
                          <Text style={styles.fileMeta}>• {formatDate(file.createdAt)}</Text>
                        </View>
                        {file.tags.length > 0 && (
                          <View style={styles.tagsList}>
                            {file.tags.slice(0, 2).map(tag => (
                              <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {filteredImages.length === 0 ? (
              <View style={styles.emptyState}>
                <ImageIcon size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No generated images</Text>
                <Text style={styles.emptyText}>Generated images will appear here</Text>
              </View>
            ) : (
              <View style={styles.imagesGrid}>
                {filteredImages.map((image) => (
                  <TouchableOpacity
                    key={image.id}
                    style={styles.imageCard}
                    onPress={() => {
                      setSelectedImage(image);
                      setShowImageModal(true);
                    }}
                  >
                    <Image source={{ uri: image.url }} style={styles.generatedImage} />
                    <View style={styles.imageOverlay}>
                      <Text style={styles.imagePrompt} numberOfLines={2}>{image.prompt}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* File Detail Modal */}
      <Modal visible={showFileModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            {selectedFile && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>File Details</Text>
                  <TouchableOpacity onPress={() => setShowFileModal(false)}>
                    <X size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {selectedFile.type === 'image' && selectedFile.thumbnail && (
                  <Image source={{ uri: selectedFile.thumbnail }} style={styles.modalImage} />
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedFile.name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{FILE_TYPE_CONFIG[selectedFile.type].label}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>{formatFileSize(selectedFile.size)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{new Date(selectedFile.createdAt).toLocaleString()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>URI</Text>
                  <View style={styles.uriRow}>
                    <Text style={styles.uriText} numberOfLines={1}>{selectedFile.uri}</Text>
                    <CopyButton text={selectedFile.uri} size={16} />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteFile(selectedFile.id)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete File</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Detail Modal */}
      <Modal visible={showImageModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            {selectedImage && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Generated Image</Text>
                  <TouchableOpacity onPress={() => setShowImageModal(false)}>
                    <X size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <Image source={{ uri: selectedImage.url }} style={styles.modalImage} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Prompt</Text>
                  <Text style={styles.detailValue}>{selectedImage.prompt}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>{selectedImage.size}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{new Date(selectedImage.createdAt).toLocaleString()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>URL</Text>
                  <View style={styles.uriRow}>
                    <Text style={styles.uriText} numberOfLines={1}>{selectedImage.url}</Text>
                    <CopyButton text={selectedImage.url} size={16} />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteImage(selectedImage.id)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete Image</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#eef2ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  uploadSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  filesList: {
    gap: 12,
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fileIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  fileType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6366f1',
    textTransform: 'uppercase' as const,
  },
  fileMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  tagsList: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  imagePrompt: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  detailValue: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 22,
  },
  uriRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  uriText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
  },
  modalActions: {
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
});
