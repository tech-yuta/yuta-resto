/**
 * Central source of all French UI labels for yuta-display.
 * Centralised here to simplify future i18n work without adding complexity now.
 */
export const uiText = {
  // Navigation
  dashboard: 'Tableau de bord',
  openDisplay: "Ouvrir l'affichage",

  // Section labels
  media: 'Médias',
  addMedia: 'Ajouter un média',

  // Table columns
  preview: 'Aperçu',
  title: 'Titre',
  type: 'Type',
  duration: 'Durée',
  sortOrder: "Ordre d'affichage",
  status: 'Statut',
  actions: 'Actions',

  // Status
  active: 'Actif',
  inactive: 'Inactif',

  // Media types
  image: 'Image',
  video: 'Vidéo',

  // Action buttons
  edit: 'Modifier',
  delete: 'Supprimer',
  save: 'Enregistrer',
  cancel: 'Annuler',
  upload: 'Téléverser',

  // Time
  seconds: 'secondes',

  // Empty / fallback states
  noActiveMedia: 'Aucun média actif',
  noMedia: 'Aucun média',

  // Feedback
  mediaDeleted: 'Média supprimé avec succès',
  mediaUpdated: 'Média modifié avec succès',
  mediaAdded: 'Média ajouté avec succès',
  loading: 'Chargement…',
  error: 'Une erreur est survenue',

  // Validation
  file: 'Fichier',
  fileTooLarge: 'Le fichier est trop volumineux',
  unsupportedFileFormat: 'Format de fichier non autorisé',
  fileRequired: 'Veuillez sélectionner un fichier',

  // Confirmations
  confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce média ?',
} as const;
