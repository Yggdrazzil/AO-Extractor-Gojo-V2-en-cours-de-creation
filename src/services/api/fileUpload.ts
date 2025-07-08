import { supabase } from './supabaseClient';

export interface FileUploadResult {
  url: string;
  path: string;
  content?: string;
}

// Fonction pour extraire le texte d'un fichier PDF (simulation)
async function extractTextFromPDF(file: File): Promise<string> {
  // Pour l'instant, on retourne un placeholder
  // Dans une vraie implémentation, on utiliserait une bibliothèque comme pdf-parse
  return `Contenu extrait du CV ${file.name} - Cette fonctionnalité sera implémentée avec une bibliothèque d'extraction PDF`;
}

// Fonction pour extraire le texte d'un fichier Word (simulation)
async function extractTextFromWord(file: File): Promise<string> {
  // Pour l'instant, on retourne un placeholder
  // Dans une vraie implémentation, on utiliserait une bibliothèque comme mammoth
  return `Contenu extrait du CV ${file.name} - Cette fonctionnalité sera implémentée avec une bibliothèque d'extraction Word`;
}

// Fonction pour extraire le contenu textuel d'un fichier
export async function extractFileContent(file: File): Promise<string> {
  const fileType = file.type;
  
  try {
    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (
      fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractTextFromWord(file);
    } else {
      return `Fichier ${file.name} - Type non supporté pour l'extraction de contenu`;
    }
  } catch (error) {
    console.error('Erreur lors de l\'extraction du contenu:', error);
    return `Erreur lors de l'extraction du contenu de ${file.name}`;
  }
}

export async function uploadFile(file: File, folder: string = 'cvs'): Promise<FileUploadResult> {
  try {
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log('Uploading file:', { fileName, filePath, size: file.size });

    // Upload du fichier vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', uploadData);

    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Impossible d\'obtenir l\'URL du fichier');
    }

    // Extraire le contenu textuel du fichier
    const content = await extractFileContent(file);

    console.log('File upload completed:', {
      url: urlData.publicUrl,
      path: filePath,
      contentLength: content.length
    });

    return {
      url: urlData.publicUrl,
      path: filePath,
      content
    };
  } catch (error) {
    console.error('File upload failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur lors de l\'upload du fichier');
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('files')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    console.log('File deleted successfully:', filePath);
  } catch (error) {
    console.error('File deletion failed:', error);
    throw error;
  }
}