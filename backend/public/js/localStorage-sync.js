// localStorage to Backend Sync Utility
// This script migrates localStorage data to backend when user is authenticated

(async function() {
  'use strict';

  // Check if user is authenticated
  const token = localStorage.getItem('authToken');
  if (!token || !window.apiClient) {
    return; // User not authenticated or API client not loaded
  }

  // Sync CV builder data
  async function syncCVData() {
    try {
      const cvData = localStorage.getItem('cv-builder-data');
      if (!cvData) return;

      const data = JSON.parse(cvData);
      
      // Get user's resumes
      const resumesResponse = await window.apiClient.getResumes();
      if (!resumesResponse.success) return;

      // Check if we have a draft resume
      let draftResume = resumesResponse.data.resumes.find(
        r => r.status === 'DRAFT' && r.title === 'Yeni Özgeçmiş'
      );

      if (draftResume) {
        // Update existing draft
        const resumeData = {
          firstName: data['fullname-first'] || '',
          lastName: data['fullname-last'] || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          profession: data.profession || '',
          summary: data.summary || '',
        };

        await window.apiClient.updateResume(draftResume.id, resumeData);
      } else if (Object.keys(data).length > 0) {
        // Create new resume from localStorage data
        const resumeData = {
          title: 'Yeni Özgeçmiş',
          templateId: 'modern',
          status: 'DRAFT',
          firstName: data['fullname-first'] || '',
          lastName: data['fullname-last'] || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          profession: data.profession || '',
          summary: data.summary || '',
        };

        await window.apiClient.createResume(resumeData);
      }
    } catch (error) {
      console.error('Failed to sync CV data:', error);
    }
  }

  // Sync experiences
  async function syncExperiences() {
    try {
      const experiencesData = localStorage.getItem('cv-experiences');
      if (!experiencesData) return;

      const experiences = JSON.parse(experiencesData);
      if (!Array.isArray(experiences) || experiences.length === 0) return;

      // Get user's resumes
      const resumesResponse = await window.apiClient.getResumes();
      if (!resumesResponse.success) return;

      const draftResume = resumesResponse.data.resumes.find(
        r => r.status === 'DRAFT'
      );

      if (draftResume) {
        // Update resume with experiences
        await window.apiClient.updateResume(draftResume.id, {
          experience: experiences,
        });
      }
    } catch (error) {
      console.error('Failed to sync experiences:', error);
    }
  }

  // Run sync when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      syncCVData();
      syncExperiences();
    });
  } else {
    syncCVData();
    syncExperiences();
  }
})();







