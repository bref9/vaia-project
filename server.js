const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

// Configuration de la base de données
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'planity_new',
  port: 8889
});

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    return;
  }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

function formatTime(timeString) {
  if (!timeString) return null;
  if (timeString.length === 5) return timeString;
  return timeString.substring(0, 5);
}

// LoginScreen //
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const clientQuery = 'SELECT * FROM client WHERE mail = ?';
  db.query(clientQuery, [email], (err, clientResult) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur (client)' });

    if (clientResult.length > 0) {
      const client = clientResult[0];

      return bcrypt.compare(password, client.mot_de_passe, (err, isMatch) => {
        if (err) return res.status(500).json({ error: 'Erreur comparaison mot de passe' });

        return isMatch
          ? res.json({
              role: 'client',
              id: client.id_client,
              message: 'Connexion réussie'
            })
          : res.status(400).json({ error: 'Mot de passe incorrect' });
      });
    }

    const prestataireQuery = 'SELECT * FROM prestataire WHERE mail = ?';
    db.query(prestataireQuery, [email], (err, prestataireResult) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur (prestataire)' });

      if (prestataireResult.length > 0) {
        const prestataire = prestataireResult[0];

        return bcrypt.compare(password, prestataire.mot_de_passe, (err, isMatch) => {
          if (err) return res.status(500).json({ error: 'Erreur comparaison mot de passe' });

          return isMatch
            ? res.json({
                role: 'prestataire',
                id: prestataire.id_prestataire,
                message: 'Connexion réussie'
              })
            : res.status(400).json({ error: 'Mot de passe incorrect' });
        });
      }

      const employeQuery = 'SELECT * FROM employe WHERE mail = ?';
      db.query(employeQuery, [email], (err, employeResult) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur (employé)' });

        if (employeResult.length > 0) {
          const employe = employeResult[0];

          return bcrypt.compare(password, employe.mot_de_passe, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Erreur comparaison mot de passe' });

            return isMatch
              ? res.json({
                  role: 'employe',
                  id: employe.id_employe,
                  id_prestataire: employe.id_prestataire,
                  message: 'Connexion réussie'
                })
              : res.status(400).json({ error: 'Mot de passe incorrect' });
          });
        }

        return res.status(404).json({ error: 'Email non trouvé' });
      });
    });
  });
});

// ClientSignup //
app.post('/signup/client', (req, res) => {
  const { email, password, prenom, nom, genre, date_naissance, adresse, ville, code_postal, pays, numero } = req.body;

  if (!email || !password || !prenom || !nom || !genre || !date_naissance || !pays || !numero) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
  }

  const emailQuery = 'SELECT * FROM client WHERE mail = ?';
  db.query(emailQuery, [email], async (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur lors de la vérification de l\'email.' });
    }

    if (result.length > 0) {
      return res.status(400).json({ error: 'L\'email existe déjà.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const clientQuery = `
    INSERT INTO client (prenom, nom, mail, genre, date_naissance, adresse, ville, code_postal, pays, numero, mot_de_passe)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(clientQuery, [
      prenom, nom, email, genre, date_naissance, adresse, ville, code_postal, pays, numero, hashedPassword
    ], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
      }

      res.status(201).json({ message: 'Inscription réussie.' });
    });
  });
});

// PrestataireSignup //
app.post('/signup/prestataire', async (req, res) => {
  const {
    email, password, prenom, nom, genre, date_naissance, adresse, ville, numero, code_postal, pays
  } = req.body;

  if (!nom || !prenom || !email || !genre || !date_naissance || !adresse || !ville || !numero || !password || !code_postal || !pays) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
  }

  const emailQuery = 'SELECT * FROM prestataire WHERE mail = ?';
  db.query(emailQuery, [email], async (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur lors de la vérification de l\'email.' });
    }
    if (result.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const prestataireQuery = `INSERT INTO prestataire 
    (nom, prenom, mail, genre, date_naissance, adresse, ville, numero, mot_de_passe, code_postal, pays) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(prestataireQuery, [
      nom, prenom, email, genre, date_naissance, adresse, ville, numero, hashedPassword, code_postal, pays
    ], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur lors de l\'inscription du prestataire.' });
      }

      res.status(201).json({ 
        message: 'Inscription réussie.',
        id_prestataire: result.insertId
      });
    });
  });
});

// Route pour vérifier l'unicité de l'email et du numéro
app.post('/check-unique-credentials', (req, res) => {
  const { email, numero } = req.body;

  if (!email && !numero) {
    return res.status(400).json({ error: 'Email ou numéro requis' });
  }

  const checkEmail = (callback) => {
    if (!email) return callback(null, false, '');
    
    db.query('SELECT id_client FROM client WHERE mail = ?', [email], (err1, clients) => {
      if (err1) return callback(err1);
      
      if (clients.length > 0) {
        return callback(null, true, 'client');
      }
      
      db.query('SELECT id_prestataire FROM prestataire WHERE mail = ?', [email], (err2, prestataires) => {
        if (err2) return callback(err2);
        
        if (prestataires.length > 0) {
          return callback(null, true, 'prestataire');
        }
        
        db.query('SELECT id_employe FROM employe WHERE mail = ?', [email], (err3, employes) => {
          if (err3) return callback(err3);
          
          if (employes.length > 0) {
            return callback(null, true, 'employé');
          }
          
          callback(null, false, '');
        });
      });
    });
  };

  const checkNumero = (callback) => {
    if (!numero) return callback(null, false, '');
    
    db.query('SELECT id_client FROM client WHERE numero = ?', [numero], (err1, clients) => {
      if (err1) return callback(err1);
      
      if (clients.length > 0) {
        return callback(null, true, 'client');
      }
      
      db.query('SELECT id_prestataire FROM prestataire WHERE numero = ?', [numero], (err2, prestataires) => {
        if (err2) return callback(err2);
        
        if (prestataires.length > 0) {
          return callback(null, true, 'prestataire');
        }
        
        db.query('SELECT id_employe FROM employe WHERE numero = ?', [numero], (err3, employes) => {
          if (err3) return callback(err3);
          
          if (employes.length > 0) {
            return callback(null, true, 'employé');
          }
          
          callback(null, false, '');
        });
      });
    });
  };

  checkEmail((emailErr, emailExists, emailUserType) => {
    if (emailErr) {
      return res.status(500).json({ error: 'Erreur vérification email' });
    }

    checkNumero((numeroErr, numeroExists, numeroUserType) => {
      if (numeroErr) {
        return res.status(500).json({ error: 'Erreur vérification numéro' });
      }

      const existingUserType = emailExists ? emailUserType : (numeroExists ? numeroUserType : '');

      res.json({
        emailExists,
        numeroExists,
        existingUserType,
        message: emailExists || numeroExists ? 
          `Ces identifiants sont déjà utilisés}` : 
          'Identifiants disponibles'
      });
    });
  });
});


// Page EntrepriseInfoSignupScreen//
app.post('/signup/entreprise', async (req, res) => {
  const { id_prestataire, nom, adresse, ville, code_postal, numero, informations, prestataireData } = req.body;

  let finalIdPrestataire = id_prestataire;

  if (!finalIdPrestataire && prestataireData && prestataireData.email) {
    const findPrestataireQuery = 'SELECT id_prestataire FROM prestataire WHERE mail = ?';
    db.query(findPrestataireQuery, [prestataireData.email], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la recherche du prestataire.' });
      }

      if (results.length > 0) {
        finalIdPrestataire = results[0].id_prestataire;
        createEntreprise(finalIdPrestataire);
      } else {
        return res.status(404).json({ error: 'Prestataire non trouvé.' });
      }
    });
  } else if (finalIdPrestataire) {
    createEntreprise(finalIdPrestataire);
  } else {
    return res.status(400).json({ error: 'ID prestataire manquant.' });
  }

  function createEntreprise(idPrestataire) {
    if (!idPrestataire || !nom || !adresse || !ville || !code_postal) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
    }

    const entrepriseQuery = `
      INSERT INTO entreprise (id_prestataire, nom, adresse, ville, code_postal, numero, informations)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(entrepriseQuery, [
      idPrestataire,
      nom,
      adresse,
      ville,
      code_postal,
      numero || null,
      informations || null
    ], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la création de l\'entreprise.' });
      }

      res.status(201).json({ 
        message: 'Entreprise créée avec succès.',
        id_entreprise: result.insertId
      });
    });
  }
});

// Route pour mettre à jour les disponibilités du prestataire
app.put('/prestataire/:id/disponibilites', async (req, res) => {
  const { id } = req.params;
  const { disponibilites } = req.body;

  if (!disponibilites) {
    return res.status(400).json({ error: 'Données de disponibilités manquantes.' });
  }

  try {
    const updateQuery = `
      UPDATE prestataire 
      SET disponibilite = ?
      WHERE id_prestataire = ?
    `;

    db.query(updateQuery, [disponibilites, id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la mise à jour des disponibilités.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Prestataire non trouvé.' });
      }

      res.json({ 
        message: 'Disponibilités mises à jour avec succès.'
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Page Catégorie //
app.get('/api/categories-populaires', (req, res) => {
  const query = `
    SELECT 
      categorie as nom, 
      COUNT(*) as count 
    FROM prestation 
    WHERE categorie IS NOT NULL
      AND categorie != ''
    GROUP BY categorie 
    ORDER BY count DESC 
    LIMIT 4
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

app.get('/categories', (req, res) => {
  const query = `
    SELECT DISTINCT categorie 
    FROM prestation 
    WHERE categorie IS NOT NULL 
      AND categorie != ''
    ORDER BY categorie
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.json({ 
        categories: [] 
      });
    }

    const categories = results.map(row => row.categorie);
    res.json({ categories });
  });
});

app.get('/prestations', (req, res) => {
  const { categorie, search, sortByPrice, id_prestataire } = req.query;
  let query = `
      SELECT 
          p.id_prestataire,
          e.nom AS nom_entreprise,
          e.adresse AS adresse_entreprise,
          e.forfait,
          e.ville AS ville_entreprise,
          e.code_postal AS cp_entreprise,
          e.informations,
          MIN(pr.id_prestation) AS id_prestation,
          MIN(pr.titre) AS titre,
          MIN(pr.prix) AS prix,
          MIN(pr.description) AS description,
          MIN(pr.temps) AS temps,
          pr.categorie
      FROM prestataire p
      LEFT JOIN entreprise e ON p.id_prestataire = e.id_prestataire
      LEFT JOIN prestation pr ON p.id_prestataire = pr.id_prestataire
      WHERE 1=1
  `;
  const params = [];

  if (id_prestataire) {
    query += ' AND p.id_prestataire = ?';
    params.push(id_prestataire);
  }

  if (categorie) {
    query += ' AND pr.categorie = ?';
    params.push(categorie);
  }

  if (search) {
    query += ' AND (pr.titre LIKE ? OR pr.description LIKE ?)';
    params.push(`${search}%`, `${search}%`);
  }

  query += `
    GROUP BY p.id_prestataire
  `;

  if (sortByPrice) {
    query += sortByPrice === 'asc'
      ? ' ORDER BY prix ASC'
      : ' ORDER BY prix DESC';
  }

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    res.json({ prestations: result });
  });
});

app.get('/entreprise', (req, res) => {
  const { id_prestataire } = req.query;

  const query = `
    SELECT 
      e.nom AS nom_salon,
      e.adresse,
      e.ville,
      e.code_postal,
      e.numero,
      e.informations,
      p.nom_categorie,
      p.titre AS prestation_titre,
      p.prix AS prestation_prix,
      p.description AS prestation_description,
      p.temps AS prestation_temps
    FROM entreprise e
    LEFT JOIN prestation p ON e.id_prestataire = p.id_prestataire
    WHERE e.id_prestataire = ?
    ORDER BY p.nom_categorie, p.titre
  `;

  db.query(query, [id_prestataire], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (result.length > 0) {
      const entrepriseData = result.reduce((acc, row) => {
        const { nom_salon, adresse, ville, code_postal, informations, horaires, nom_categorie, prestation_titre, prestation_prix, prestation_description, prestation_temps } = row;

        if (!acc.nom_salon) {
          acc.nom_salon = nom_salon;
          acc.adresse = adresse;
          acc.ville = ville;
          acc.code_postal = code_postal;
          acc.informations = informations;
          acc.horaires = horaires;
          acc.prestations = {};
        }

        if (!acc.prestations[nom_categorie]) {
          acc.prestations[nom_categorie] = [];
        }

        acc.prestations[nom_categorie].push({
          titre: prestation_titre,
          prix: prestation_prix,
          description: prestation_description,
          temps: prestation_temps
        });

        return acc;
      }, {});

      res.json(entrepriseData);
    } else {
      res.status(404).json({ error: 'Entreprise non trouvée' });
    }
  });
});

// Route pour créer les horaires du salon
app.post('/signup/horaires', async (req, res) => {
  const { id_entreprise, horaires } = req.body;

  if (!id_entreprise || !horaires) {
    return res.status(400).json({ error: 'ID entreprise et horaires requis.' });
  }

  try {
    await new Promise((resolve, reject) => {
      db.query('START TRANSACTION', (err) => err ? reject(err) : resolve());
    });

    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    for (const jour of jours) {
      const horaire = horaires[jour] || { is_ferme: true };

      const result = await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO horaires_salon (id_entreprise, jour_semaine, is_ferme, heure_ouverture, heure_fermeture) VALUES (?, ?, ?, ?, ?)',
          [
            id_entreprise,
            jour,
            horaire.is_ferme ? 1 : 0,
            horaire.is_ferme ? '00:00:00' : (horaire.heure_ouverture + ':00' || '09:00:00'),
            horaire.is_ferme ? '00:00:00' : (horaire.heure_fermeture + ':00' || '18:00:00')
          ],
          (err, results) => err ? reject(err) : resolve(results)
        );
      });

      if (!horaire.is_ferme && horaire.pauses && horaire.pauses.length > 0) {
        for (const pause of horaire.pauses) {
          await new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO horaires_salon_pause (salon_id, jour_semaine, heure_debut, heure_fin) VALUES (?, ?, ?, ?)',
              [
                result.insertId,
                jour,
                pause.heure_debut + ':00' || '12:00:00',
                pause.heure_fin + ':00' || '14:00:00'
              ],
              (err) => err ? reject(err) : resolve()
            );
          });
        }
      }
    }

    await new Promise((resolve, reject) => {
      db.query('COMMIT', (err) => err ? reject(err) : resolve());
    });

    res.status(201).json({ 
      message: 'Horaires créés avec succès.'
    });

  } catch (error) {
    await new Promise((resolve) => {
      db.query('ROLLBACK', () => resolve());
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de la création des horaires',
      details: error.message 
    });
  }
});

// page EntrepriseScreen //
app.get('/EntrepriseScreen/entreprise', (req, res) => {
  const { id_prestataire } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ error: 'id_prestataire est requis' });
  }

  const query = `
    SELECT 
      e.id_entreprise,
      e.nom AS nom_salon,
      e.adresse,
      e.ville,
      e.code_postal,
      e.numero,
      e.informations,
      p.nom_categorie,
      p.id_prestation,
      p.titre AS prestation_titre,
      p.prix AS prestation_prix,
      p.description AS prestation_description,
      p.temps AS prestation_temps,
      hs.jour_semaine,
      TIME_FORMAT(hs.heure_ouverture, '%H:%i') AS horaire_ouverture,
      TIME_FORMAT(hs.heure_fermeture, '%H:%i') AS horaire_fermeture,
      hs.is_ferme,
      TIME_FORMAT(hsp.heure_debut, '%H:%i') AS pause_debut,
      TIME_FORMAT(hsp.heure_fin, '%H:%i') AS pause_fin,
      a.id_avis,
      a.note,
      a.commentaire,
      a.date_avis,
      a.reponse,
      c.prenom AS client_prenom,
      c.nom AS client_nom
    FROM entreprise e
    LEFT JOIN prestation p ON e.id_prestataire = p.id_prestataire
    LEFT JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
    LEFT JOIN horaires_salon_pause hsp ON hs.id = hsp.salon_id
    LEFT JOIN avis a ON e.id_prestataire = a.id_prestataire
    LEFT JOIN client c ON a.id_client = c.id_client
    WHERE e.id_prestataire = ?
    ORDER BY hs.jour_semaine, COALESCE(p.nom_categorie, 'Sans catégorie'), p.titre, a.date_avis DESC
  `;

  db.query(query, [id_prestataire], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const entrepriseData = {
      id_entreprise: result[0].id_entreprise,
      nom_salon: result[0].nom_salon,
      adresse: result[0].adresse,
      ville: result[0].ville,
      code_postal: result[0].code_postal,
      numero: result[0].numero,
      informations: result[0].informations,
      prestations: {},
      horaires: {},
      pauses: {},
      avis: []
    };

    result.forEach(row => {
      const categorie = row.nom_categorie || 'Sans catégorie';
      
      if (!entrepriseData.prestations[categorie]) {
        entrepriseData.prestations[categorie] = [];
      }

      if (row.id_prestation && !entrepriseData.prestations[categorie].some(p => p.id === row.id_prestation)) {
        entrepriseData.prestations[categorie].push({
          id: row.id_prestation,
          titre: row.prestation_titre,
          prix: row.prestation_prix,
          description: row.prestation_description,
          temps: row.prestation_temps
        });
      }

      if (row.jour_semaine) {
        if (!entrepriseData.horaires[row.jour_semaine]) {
          entrepriseData.horaires[row.jour_semaine] = {
            ouvert: !row.is_ferme,
            horaire_ouverture: row.horaire_ouverture,
            horaire_fermeture: row.horaire_fermeture,
            pauses: []
          };
        }

        if (row.pause_debut && row.pause_fin) {
          const pauseExists = entrepriseData.horaires[row.jour_semaine].pauses
            .some(p => p.pause_debut === row.pause_debut && p.pause_fin === row.pause_fin);

          if (!pauseExists) {
            entrepriseData.horaires[row.jour_semaine].pauses.push({
              pause_debut: row.pause_debut,
              pause_fin: row.pause_fin
            });
          }
        }
      }

      if (row.id_avis && !entrepriseData.avis.some(a => a.id_avis === row.id_avis)) {
        entrepriseData.avis.push({
          id_avis: row.id_avis,
          note: row.note,
          commentaire: row.commentaire,
          date_avis: row.date_avis,
          reponse: row.reponse,
          client_prenom: row.client_prenom,
          client_nom: row.client_nom
        });
      }
    });

    if (entrepriseData.avis.length > 0) {
      const totalNotes = entrepriseData.avis.reduce((sum, avis) => sum + avis.note, 0);
      entrepriseData.rating = (totalNotes / entrepriseData.avis.length).toFixed(1);
      entrepriseData.reviewsCount = entrepriseData.avis.length;
    } else {
      entrepriseData.rating = '4.9';
      entrepriseData.reviewsCount = '0';
    }

    res.json(entrepriseData);
  });
});



// page profil //
app.get('/profil', (req, res) => {
  const { id, type_utilisateur } = req.query;

  if (!id || !type_utilisateur) {
    return res.status(400).json({ error: 'id et type_utilisateur sont nécessaires' });
  }

  let query;
  let values;

  if (type_utilisateur === 'client') {
    query = 'SELECT prenom, nom, mail, genre, date_naissance, adresse, ville, code_postal, numero FROM client WHERE id_client = ?';
    values = [id];
  } else if (type_utilisateur === 'prestataire') {
    query = 'SELECT prenom, nom, mail, genre, date_naissance, adresse, ville, code_postal, numero, categorie, disponibilite FROM prestataire WHERE id_prestataire = ?';
    values = [id];
  } else if (type_utilisateur === 'employe') {
    query = 'SELECT nom, prenom, genre, date_naissance, adresse, ville, code_postal, numero, mail, categorie, disponibilite FROM employe WHERE id_employe = ?';
    values = [id];
  } else {
    return res.status(400).json({ error: 'Type utilisateur invalide' });
  }

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: `${type_utilisateur} non trouvé` });
    }

    // Ajouter le type d'utilisateur dans la réponse
    const profilData = {
      ...result[0],
      type_utilisateur: type_utilisateur
    };

    res.json({ profil: profilData });
  });
});


// Route pour mettre à jour le profil
app.post('/update-profile', async (req, res) => {
  try {
    const { id, type_utilisateur, prenom, nom, mail, numero, adresse, ville, code_postal, date_naissance, genre, categorie, disponibilite } = req.body;

    if (!id || !type_utilisateur) {
      return res.status(400).json({ error: 'ID et type utilisateur requis' });
    }

    let tableName, idField;
    
    switch (type_utilisateur) {
      case 'client':
        tableName = 'client';
        idField = 'id_client';
        break;
      case 'prestataire':
        tableName = 'prestataire';
        idField = 'id_prestataire';
        break;
      case 'employe':
        tableName = 'employe';
        idField = 'id_employe';
        break;
      default:
        return res.status(400).json({ error: 'Type utilisateur invalide' });
    }

    // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
    const emailCheckQuery = `SELECT ${idField} FROM ${tableName} WHERE mail = ? AND ${idField} != ?`;
    
    db.query(emailCheckQuery, [mail, id], (emailError, emailResults) => {
      if (emailError) {
        return res.status(500).json({ error: 'Erreur vérification email' });
      }

      if (emailResults.length > 0) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur' });
      }

      // Vérifier si le numéro existe déjà (sauf pour l'utilisateur actuel)
      const phoneCheckQuery = `SELECT ${idField} FROM ${tableName} WHERE numero = ? AND ${idField} != ?`;
      
      db.query(phoneCheckQuery, [numero, id], (phoneError, phoneResults) => {
        if (phoneError) {
          return res.status(500).json({ error: 'Erreur vérification numéro' });
        }

        if (phoneResults.length > 0) {
          return res.status(400).json({ error: 'Ce numéro est déjà utilisé par un autre utilisateur' });
        }

        // Préparer les champs à mettre à jour
        let updateFields = [];
        let updateParams = [];
        
        // Champs de base pour tous les utilisateurs
        const baseFields = ['prenom', 'nom', 'mail', 'numero', 'adresse', 'ville', 'code_postal', 'date_naissance', 'genre'];
        
        baseFields.forEach(field => {
          if (req.body[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            updateParams.push(req.body[field] || null);
          }
        });

        // Champs spécifiques aux prestataires/employés
        if (type_utilisateur === 'prestataire' || type_utilisateur === 'employe') {
          if (categorie !== undefined) {
            updateFields.push('categorie = ?');
            updateParams.push(categorie || null);
          }
          if (disponibilite !== undefined) {
            updateFields.push('disponibilite = ?');
            updateParams.push(disponibilite || null);
          }
        }

        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
        }

        updateParams.push(id);

        const updateQuery = `
          UPDATE ${tableName} 
          SET ${updateFields.join(', ')}
          WHERE ${idField} = ?
        `;

        // Mise à jour du profil
        db.query(updateQuery, updateParams, (updateError, updateResults) => {
          if (updateError) {
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
          }

          if (updateResults.affectedRows === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
          }

          res.json({ 
            success: true, 
            message: 'Profil mis à jour avec succès',
            updatedFields: updateFields
          });
        });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



// Route pour mettre à jour le mot de passe
app.post('/update-password', async (req, res) => {
  try {
    const { id, type_utilisateur, currentPassword, newPassword } = req.body;

    if (!id || !type_utilisateur || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    let tableName, idField;
    
    switch (type_utilisateur) {
      case 'client':
        tableName = 'client';
        idField = 'id_client';
        break;
      case 'prestataire':
        tableName = 'prestataire';
        idField = 'id_prestataire';
        break;
      case 'employe':
        tableName = 'employe';
        idField = 'id_employe';
        break;
      default:
        return res.status(400).json({ error: 'Type utilisateur invalide' });
    }

    // Récupérer l'utilisateur et vérifier l'ancien mot de passe
    const getUserQuery = `SELECT mot_de_passe FROM ${tableName} WHERE ${idField} = ?`;
    
    db.query(getUserQuery, [id], async (userError, userResults) => {
      if (userError) {
        return res.status(500).json({ error: 'Erreur vérification mot de passe' });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const user = userResults[0];

      // Vérifier l'ancien mot de passe
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.mot_de_passe);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      const updateQuery = `UPDATE ${tableName} SET mot_de_passe = ? WHERE ${idField} = ?`;
      
      db.query(updateQuery, [hashedNewPassword, id], (updateError, updateResults) => {
        if (updateError) {
          return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
        }

        if (updateResults.affectedRows === 0) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json({ 
          success: true, 
          message: 'Mot de passe mis à jour avec succès' 
        });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});




// SalonPresta.js

app.get('/salonpresta', (req, res) => {
  const { id_prestataire } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ error: 'id_prestataire manquant dans la requête' });
  }

  const sql = `
    SELECT id_prestation AS id, titre, prix, temps, categorie, description
    FROM prestation
WHERE id_prestataire = ? AND supprime = 0
  `;

  db.query(sql, [id_prestataire], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Aucune prestation trouvée pour ce prestataire' });
    }

    res.json(results);
  });
});

// Route POST pour ajouter une prestation
app.post('/ajouterPrestation/:id_prestataire', (req, res) => {
  const { id_prestataire } = req.params;
  const { titre, prix, temps, categorie, nom_categorie, description } = req.body;

  const sql = `INSERT INTO prestation (titre, prix, temps, categorie, nom_categorie, description, id_prestataire, supprime)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0)`;

  db.query(sql, [
    titre, 
    prix, 
    temps, 
    categorie, 
    nom_categorie || categorie,
    description || null, 
    id_prestataire
  ], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de l\'insertion: ' + err.message });
    }
    res.status(201).json({ 
      message: 'Prestation ajoutée avec succès', 
      id: result.insertId 
    });
  });
});

// Route PUT existante pour modifier une prestation
// Route PUT pour modifier une prestation - VERSION CORRIGÉE
app.put('/modifierPrestation/:id', (req, res) => {
  const { id } = req.params;
  const { titre, prix, temps, categorie, nom_categorie, description } = req.body;


  // Validation des champs obligatoires
  if (!titre || !prix || !temps || !categorie) {
    return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
  }

  // Si description est undefined, mettre null
  const descriptionValue = description || null;
  const nomCategorieValue = nom_categorie || categorie;

  const sql = `
    UPDATE prestation
    SET titre = ?, prix = ?, temps = ?, categorie = ?, nom_categorie = ?, description = ?
    WHERE id_prestation = ? AND supprime = 0
  `;
  
  const values = [titre, prix, temps, categorie, nomCategorieValue, descriptionValue, id];


  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ Erreur SQL:', err);
      return res.status(500).json({ 
        message: 'Erreur lors de la mise à jour de la prestation.',
        error: err.message 
      });
    }


    if (result.affectedRows > 0) {
      return res.status(200).json({ 
        message: 'Prestation mise à jour avec succès.',
        id: id 
      });
    } else {
      return res.status(404).json({ 
        message: 'Prestation non trouvée ou déjà supprimée.' 
      });
    }
  });
});


// <-- Nouvelle route GET pour récupérer les catégories d'un prestataire
app.get('/categories/:id_prestataire', (req, res) => {
  const { id_prestataire } = req.params;

  if (!id_prestataire) {
    return res.status(400).json({ error: "ID prestataire manquant." });
  }

  const sql = `
    SELECT DISTINCT categorie 
    FROM prestation 
    WHERE id_prestataire = ? AND categorie IS NOT NULL
  `;

  db.query(sql, [id_prestataire], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Erreur récupération catégories." });
    }

    const categories = result.map(row => row.categorie);
    res.json({ categories });
  });
});

// Suppression logique d'une prestation
app.delete('/supprimerPrestation/:id', (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE prestation SET supprime = 1 WHERE id_prestation = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Prestation supprimée avec succès.' });
    } else {
      return res.status(404).json({ message: 'Prestation non trouvée.' });
    }
  });
});

//page employé

app.get('/employes', (req, res) => {
  const { id_prestataire } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ message: 'id_prestataire manquant.' });
  }

  const employeSql = 'SELECT * FROM employe WHERE id_prestataire = ? AND supprime = 0';
  const categoriesSql = `
    SELECT DISTINCT categorie 
    FROM prestation 
    WHERE id_prestataire = ? AND categorie IS NOT NULL
  `;

  db.query(employeSql, [id_prestataire], (err1, employes) => {
    if (err1) {
      return res.status(500).json({ message: 'Erreur serveur (employés).' });
    }

    db.query(categoriesSql, [id_prestataire], (err2, rows) => {
      if (err2) {
        return res.status(500).json({ message: 'Erreur serveur (catégories).' });
      }

      const categoriesDisponibles = rows.map(r => r.categorie).filter(Boolean);

      res.json({
        employes,
        categoriesDisponibles
      });
    });
  });
});

app.put('/modifierEmploye/:id', (req, res) => {
  const employeId = req.params.id;
  const {
    nom, prenom, mail, numero, genre,
    adresse, code_postal, ville, pays, date_naissance,
    disponibilite, categorie
  } = req.body;

  if (!nom || !prenom || !mail || !numero || !genre || !adresse || !code_postal || !ville || !date_naissance) {
    return res.status(400).json({ message: 'Tous les champs doivent être remplis.' });
  }

  const dateFormatee = new Date(date_naissance).toISOString().split('T')[0];

  let categorieJson;
  if (Array.isArray(categorie)) {
    categorieJson = JSON.stringify(categorie);
  } else if (typeof categorie === 'string') {
    try {
      JSON.parse(categorie);
      categorieJson = categorie;
    } catch {
      categorieJson = JSON.stringify([categorie]);
    }
  } else {
    categorieJson = JSON.stringify([]);
  }

  const updateQuery = `
    UPDATE employe
    SET nom = ?, prenom = ?, mail = ?, numero = ?, genre = ?, 
        adresse = ?, code_postal = ?, ville = ?, pays = ?, date_naissance = ?, 
        disponibilite = ?, categorie = ?
    WHERE id_employe = ? AND supprime = 0  
  `;

  db.query(
    updateQuery,
    [
      nom, prenom, mail, numero, genre, 
      adresse, code_postal, ville, pays || 'France', dateFormatee,
      disponibilite, categorieJson, employeId
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur serveur' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Employé non trouvé' });
      }

      const prestataireQuery = `SELECT id_prestataire FROM employe WHERE id_employe = ?`;

      db.query(prestataireQuery, [employeId], (err2, rows) => {
        if (err2 || rows.length === 0) {
          return res.status(500).json({ message: "Erreur récupération id_prestataire." });
        }

        const id_prestataire = rows[0].id_prestataire;

        const categoriesQuery = `
          SELECT DISTINCT categorie 
          FROM prestation 
          WHERE id_prestataire = ? AND categorie IS NOT NULL
        `;

        db.query(categoriesQuery, [id_prestataire], (err3, categoriesRows) => {
          if (err3) {
            return res.status(500).json({ message: "Erreur récupération catégories." });
          }

          const categories = categoriesRows.map(r => r.categorie);

          res.json({
            message: 'Employé mis à jour avec succès.',
            categoriesDisponibles: categories
          });
        });
      });
    }
  );
});

app.put('/supprimerEmploye/:id_employe', (req, res) => {
  const { id_employe } = req.params;

  if (!id_employe) {
    return res.status(400).json({ message: "ID de l'employé manquant." });
  }

  const sql = `UPDATE employe SET supprime = 1 WHERE id_employe = ?`;

  db.query(sql, [id_employe], function(err, results) {
    if (err) {
      return res.status(500).json({ message: "Erreur lors de la suppression de l'employé." });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Aucun employé trouvé avec cet ID." });
    }

    res.status(200).json({ message: "Employé supprimé avec succès." });
  });
});

app.post('/creerEmploye', async (req, res) => {
  const {
    nom, prenom, mail, numero, genre,
    adresse, code_postal, ville, pays, date_naissance,
    mot_de_passe, id_prestataire, disponibilite, categorie
  } = req.body;

  if (!nom || !prenom || !mail || !numero || !genre || !adresse || !code_postal || !ville || !date_naissance || !mot_de_passe || !id_prestataire) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const dateFormatee = new Date(date_naissance).toISOString().split('T')[0];

    const sql = `
      INSERT INTO employe (
        nom, prenom, mail, numero, genre,
        adresse, code_postal, ville, pays, date_naissance,
        mot_de_passe, id_prestataire, disponibilite, categorie, supprime  
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nom, 
      prenom, 
      mail, 
      numero, 
      genre,
      adresse, 
      code_postal, 
      ville, 
      pays || 'France',
      dateFormatee,
      hashedPassword, 
      id_prestataire,
      disponibilite || null,
      categorie ? JSON.stringify(categorie) : null,
      0
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          if (err.message.includes('mail')) {
            return res.status(409).json({ error: "Cette adresse email est déjà utilisée." });
          }
          if (err.message.includes('numero')) {
            return res.status(409).json({ error: "Ce numéro de téléphone est déjà utilisé." });
          }
        }
        
        return res.status(500).json({ error: "Erreur lors de la création de l'employé: " + err.message });
      }

      const getCategoriesQuery = `
        SELECT DISTINCT categorie 
        FROM prestation 
        WHERE id_prestataire = ?
      `;

      db.query(getCategoriesQuery, [id_prestataire], (err2, rows) => {
        if (err2) {
          return res.status(500).json({ error: "Erreur lors de la récupération des catégories." });
        }

        const categoriesDispo = rows.map(r => r.categorie).filter(Boolean);

        res.status(201).json({
          message: "Employé créé avec succès.",
          id_employe: result.insertId,
          categoriesDispo
        });
      });
    });

  } catch (err) {
    if (err.message.includes("bcrypt")) {
      return res.status(500).json({ 
        error: "Erreur de cryptage du mot de passe."
      });
    }
    
    res.status(500).json({ error: "Erreur lors du traitement des données: " + err.message });
  }
});



//page avis dans salonPresta//

app.get('/avis', (req, res) => {
  const { id_prestataire } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ error: 'Identifiant du prestataire manquant.' });
  }

  const sql = `
    SELECT avis.id_avis, avis.commentaire, avis.note, avis.date_avis, avis.reponse,
           client.prenom, client.nom
    FROM avis
    JOIN client ON avis.id_client = client.id_client
    WHERE avis.id_prestataire = ?
  `;

  db.query(sql, [id_prestataire], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur lors de la récupération des avis.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Aucun avis trouvé pour ce prestataire.' });
    }

    res.json(result);
  });
});

// ✅ Route pour répondre à un avis
app.post('/avis/repondre', express.json(), (req, res) => {
  const { id_avis, reponse } = req.body;

  if (!id_avis || !reponse) {
    return res.status(400).json({ message: 'id_avis et reponse sont requis' });
  }

  const sql = `UPDATE avis SET reponse = ? WHERE id_avis = ?`;

  db.query(sql, [reponse, id_avis], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la réponse' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Aucun avis trouvé avec cet id' });
    }

    res.status(200).json({ message: 'Réponse enregistrée avec succès' });
  });
});

app.post('/avis/supprimer-reponse', express.json(), (req, res) => {
  const { id_avis } = req.body;

  if (!id_avis) {
    return res.status(400).json({ message: 'id_avis est requis' });
  }

  // Mise à jour de la réponse dans la base de données pour mettre à NULL
  const sql = 'UPDATE avis SET reponse = NULL WHERE id_avis = ?';
  db.query(sql, [id_avis], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Aucun avis trouvé avec cet id_avis' });
    }

    res.status(200).json({ message: 'Réponse supprimée avec succès' });
  });
});

// a propos dans salonPresta //

// GET - Récupérer les informations de l'entreprise
app.get('/salonpresta/entreprise', async (req, res) => {
  const { id_prestataire } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ error: 'id_prestataire est requis' });
  }

  try {
    // 1. Récupération entreprise
    const entreprise = await new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM entreprise WHERE id_prestataire = ?', 
        [id_prestataire],
        (error, results) => {
          if (error) return reject(error);
          resolve(results[0]); // Prend le premier résultat
        }
      );
    });

    if (!entreprise) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    // 2. Récupération des horaires
    const horaires = await new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM horaires_salon WHERE id_entreprise = ?',
        [entreprise.id_entreprise],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );
    });

    // 3. Récupération des pauses
    const pauses = await new Promise((resolve, reject) => {
      db.query(
        `SELECT hsp.*, hs.jour_semaine 
         FROM horaires_salon_pause hsp
         JOIN horaires_salon hs ON hsp.salon_id = hs.id
         WHERE hs.id_entreprise = ?`,
        [entreprise.id_entreprise],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );
    });

    // 4. Structuration des données
    const horairesStructure = {};
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    jours.forEach(jour => {
      const horaire = horaires.find(h => h.jour_semaine === jour);
      const pausesDuJour = pauses.filter(p => p.jour_semaine === jour);
      
      horairesStructure[jour] = {
        is_ferme: horaire ? Boolean(horaire.is_ferme) : true,
        heure_ouverture: horaire ? formatTime(horaire.heure_ouverture) : '09:00',
        heure_fermeture: horaire ? formatTime(horaire.heure_fermeture) : '18:00',
        pauses: pausesDuJour.map(p => ({
          heure_debut: formatTime(p.heure_debut),
          heure_fin: formatTime(p.heure_fin)
        }))
      };
    });

    res.json({
      ...entreprise,
      horaires: horairesStructure
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
});

// PUT - Mettre à jour les informations de l'entreprise
app.put('/salonpresta/entreprise', express.json(), async (req, res) => {
  const { id_entreprise, nom, adresse, ville, code_postal, numero, informations } = req.body;

  if (!id_entreprise) {
    return res.status(400).json({ error: 'id_entreprise est requis' });
  }

  try {
    const sql = `
      UPDATE entreprise 
      SET nom = ?, adresse = ?, ville = ?, code_postal = ?, numero = ?, informations = ?
      WHERE id_entreprise = ?
    `;

    const result = await new Promise((resolve, reject) => {
      db.query(
        sql, 
        [nom, adresse, ville, code_postal, numero, informations, id_entreprise],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    res.json({ 
      message: 'Informations mises à jour avec succès',
      affectedRows: result.affectedRows
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour',
      details: err.message 
    });
  }
});

// PUT - Mettre à jour les horaires de l'entreprise
app.put('/salonpresta/entreprise/horaires', express.json(), async (req, res) => {
  const { id_entreprise, horaires } = req.body;

  if (!id_entreprise || !horaires) {
    return res.status(400).json({ error: 'id_entreprise et horaires sont requis' });
  }

  try {
    // Démarrer une transaction
    await new Promise((resolve, reject) => {
      db.query('START TRANSACTION', (err) => err ? reject(err) : resolve());
    });

    // Supprimer les anciens horaires et pauses
    await new Promise((resolve, reject) => {
      // D'abord supprimer les pauses
      db.query(
        'DELETE hsp FROM horaires_salon_pause hsp JOIN horaires_salon hs ON hsp.salon_id = hs.id WHERE hs.id_entreprise = ?',
        [id_entreprise],
        (err) => {
          if (err) return reject(err);
          
          // Ensuite supprimer les horaires
          db.query(
            'DELETE FROM horaires_salon WHERE id_entreprise = ?',
            [id_entreprise],
            (err) => err ? reject(err) : resolve()
          );
        }
      );
    });

    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    for (const jour of jours) {
      const horaire = horaires[jour] || { is_ferme: true };

      // Insérer l'horaire principal
      const result = await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO horaires_salon (id_entreprise, jour_semaine, is_ferme, heure_ouverture, heure_fermeture) VALUES (?, ?, ?, ?, ?)',
          [
            id_entreprise,
            jour,
            horaire.is_ferme ? 1 : 0,
            horaire.is_ferme ? '00:00:00' : (horaire.heure_ouverture + ':00' || '09:00:00'),
            horaire.is_ferme ? '00:00:00' : (horaire.heure_fermeture + ':00' || '18:00:00')
          ],
          (err, results) => err ? reject(err) : resolve(results)
        );
      });

      // Insérer les pauses si le jour est ouvert
      if (!horaire.is_ferme && horaire.pauses && horaire.pauses.length > 0) {
        for (const pause of horaire.pauses) {
          await new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO horaires_salon_pause (salon_id, jour_semaine, heure_debut, heure_fin) VALUES (?, ?, ?, ?)',
              [
                result.insertId,
                jour,
                pause.heure_debut + ':00' || '12:00:00',
                pause.heure_fin + ':00' || '14:00:00'
              ],
              (err) => err ? reject(err) : resolve()
            );
          });
        }
      }
    }

    // Valider la transaction
    await new Promise((resolve, reject) => {
      db.query('COMMIT', (err) => err ? reject(err) : resolve());
    });

    res.json({ message: 'Horaires mis à jour avec succès' });

  } catch (err) {
    // Annuler en cas d'erreur
    await new Promise((resolve) => {
      db.query('ROLLBACK', () => resolve());
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour des horaires',
      details: err.message 
    });
  }
});

// Fonction utilitaire pour formater l'heure (HH:MM:SS -> HH:MM)
function formatTime(timeString) {
  if (!timeString) return '00:00';
  if (timeString.length >= 8) {
    return timeString.substring(0, 5); // Format HH:MM:SS -> HH:MM
  }
  return timeString.length >= 5 ? timeString.substring(0, 5) : timeString;
}

app.put('/salonpresta/entreprise/horaires', async (req, res) => {
  const { id_entreprise, horaires } = req.body;

  if (!id_entreprise || !horaires) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    // Démarrer une transaction
    await new Promise((resolve, reject) => {
      db.query('START TRANSACTION', (err) => err ? reject(err) : resolve());
    });

    // Supprimer les anciens horaires
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM horaires_salon WHERE id_entreprise = ?', [id_entreprise], (err) => {
        if (err) return reject(err);
        
        // Supprimer les pauses associées
        db.query('DELETE FROM horaires_salon_pause WHERE salon_id IN (SELECT id FROM horaires_salon WHERE id_entreprise = ?)', 
          [id_entreprise], (err) => err ? reject(err) : resolve());
      });
    });

    // Insérer les nouveaux horaires
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    for (const jour of jours) {
      const horaire = horaires[jour] || { is_ferme: true };

      // Insérer l'horaire principal
      const [result] = await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO horaires_salon (id_entreprise, jour_semaine, is_ferme, heure_ouverture, heure_fermeture) VALUES (?, ?, ?, ?, ?)',
          [
            id_entreprise,
            jour,
            horaire.is_ferme,
            horaire.is_ferme ? '00:00' : horaire.heure_ouverture || '09:00',
            horaire.is_ferme ? '00:00' : horaire.heure_fermeture || '18:00'
          ],
          (err, results) => err ? reject(err) : resolve(results)
        );
      });

      // Insérer les pauses si le jour est ouvert
      if (!horaire.is_ferme && horaire.pauses && horaire.pauses.length > 0) {
        for (const pause of horaire.pauses) {
          await new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO horaires_salon_pause (salon_id, jour_semaine, heure_debut, heure_fin) VALUES (?, ?, ?, ?)',
              [result.insertId, jour, pause.heure_debut, pause.heure_fin],
              (err) => err ? reject(err) : resolve()
            );
          });
        }
      }
    }

    // Valider la transaction
    await new Promise((resolve, reject) => {
      db.query('COMMIT', (err) => err ? reject(err) : resolve());
    });

    res.json({ message: 'Horaires mis à jour avec succès' });
  } catch (err) {
    // Annuler en cas d'erreur
    await new Promise((resolve) => {
      db.query('ROLLBACK', () => resolve());
    });
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



//page HomePresta//


// Nouvel endpoint pour créer une réservation
app.post('/api/reservations/homepresta', async (req, res) => {
  try {
    const {
      id_prestation,
      id_employe,
      id_prestataire,
      date_reservation,
      heure_debut,
      heure_fin,
      mode_paiement,
      statut,
      commentaire,
      client_nom,
      client_prenom,
      client_mail,
      client_numero,
      client_adresse,
      id_client
    } = req.body;

    // Validation des champs requis
    if (!id_prestation || !date_reservation || !heure_debut || !heure_fin || !client_nom || !client_prenom) {
      return res.status(400).json({ 
        error: 'Champs manquants: prestation, date, horaires et informations client sont obligatoires' 
      });
    }

    let clientId = id_client;

    // Si pas d'ID client, créer ou rechercher le client
    if (!clientId) {
      if (!client_mail && !client_numero) {
        return res.status(400).json({ 
          error: 'Email ou téléphone requis pour identifier le client' 
        });
      }

      // Rechercher le client existant
      const clientQuery = `
        SELECT id_client 
        FROM client 
        WHERE (mail = ? OR numero = ?) 
        LIMIT 1
      `;
      
      const [existingClient] = await db.query(clientQuery, [client_mail || null, client_numero || null]);

      if (existingClient) {
        clientId = existingClient.id_client;
      } else {
        // Créer un nouveau client
        const [clientResult] = await db.query(
          `INSERT INTO client SET ?`,
          {
            nom: client_nom,
            prenom: client_prenom,
            mail: client_mail || null,
            numero: client_numero || null,
            adresse: client_adresse || null,
            genre: null,
            date_naissance: null,
            mot_de_passe: null,
            ville: null,
            code_postal: null,
            created_at: new Date()
          }
        );
        clientId = clientResult.insertId;
      }
    }

    // Vérifier les conflits de réservation
    const conflictQuery = `
      SELECT id_reservation 
      FROM reservation 
      WHERE date_reservation = ? 
        AND (
          (heure_debut < ? AND heure_fin > ?) OR
          (heure_debut >= ? AND heure_debut < ?) OR
          (heure_fin > ? AND heure_fin <= ?)
        )
        AND statut = 'reservé'
        AND annulee = 0
        AND supprimee = 0
    `;

    const [conflicts] = await db.query(conflictQuery, [
      date_reservation, heure_fin, heure_debut,
      heure_debut, heure_fin,
      heure_debut, heure_fin
    ]);

    if (conflicts.length > 0) {
      return res.status(409).json({ 
        error: 'Conflit de réservation: Un créneau est déjà réservé à cette heure' 
      });
    }

    // Insérer la réservation
    const [result] = await db.query(
      `INSERT INTO reservation SET ?`,
      {
        id_prestation,
        id_employe: id_employe || null,
        id_prestataire: id_prestataire || null,
        id_client: clientId,
        date_reservation,
        heure_debut,
        heure_fin,
        mode_paiement: mode_paiement || 'en ligne',
        statut: statut || 'reservé',
        commentaire: commentaire || null,
        created_at: new Date(),
        updated_at: new Date(),
        annulee: 0,
        supprimee: 0
      }
    );

    // Récupérer les détails de la réservation créée
    const reservationQuery = `
      SELECT 
        r.*,
        p.titre as prestation_titre,
        p.prix as prestation_prix,
        p.temps as prestation_temps,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.mail as client_mail,
        c.numero as client_telephone
      FROM reservation r
      JOIN prestation p ON r.id_prestation = p.id_prestation
      JOIN client c ON r.id_client = c.id_client
      WHERE r.id_reservation = ?
    `;

    const [reservationDetails] = await db.query(reservationQuery, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      reservation_id: result.insertId,
      client_id: clientId,
      isNewClient: !id_client,
      reservation: reservationDetails[0]
    });

  } catch (error) {
    console.error('Erreur création réservation:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de la réservation',
      details: error.message 
    });
  }
});

// Nouvel endpoint pour vérifier la disponibilité avec intersection
app.get('/api/disponibilite-reelle-par-jour', async (req, res) => {
  try {
    const { prestataire_id, date } = req.query;
    
    if (!prestataire_id || !date) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const selectedDate = new Date(date);
    const jourSemaine = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // 1. Récupérer les horaires du salon
    const horaireQuery = `
      SELECT hs.jour_semaine, hs.heure_ouverture, hs.heure_fermeture, hs.is_ferme,
             hsp.heure_debut as pause_debut, hsp.heure_fin as pause_fin
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      LEFT JOIN horaires_salon_pause hsp ON hs.id = hsp.salon_id AND hs.jour_semaine = hsp.jour_semaine
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;
    
    db.query(horaireQuery, [prestataire_id, jourSemaine], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0 || results[0].is_ferme) {
        return res.json({ 
          disponible: false,
          raison: 'Salon fermé',
          jour: jourSemaine
        });
      }

      const horaireSalon = results[0];

      // 2. Récupérer tous les intervenants
      const intervenantsQuery = `
        (SELECT id_prestataire as id, prenom, nom, 'prestataire' as type, disponibilite
         FROM prestataire WHERE id_prestataire = ?)
        UNION
        (SELECT id_employe as id, prenom, nom, 'employe' as type, disponibilite
         FROM employe WHERE id_prestataire = ? AND supprime = 0)
      `;

      db.query(intervenantsQuery, [prestataire_id, prestataire_id], (error, intervenants) => {
        if (error) {
          return res.status(500).json({ error: 'Erreur base de données' });
        }

        // 3. Pour chaque intervenant, vérifier l'intersection
        let intervenantsDisponibles = [];
        
        intervenants.forEach(intervenant => {
          let disponibilitesIntervenant = {};
          
          if (intervenant.disponibilite) {
            try {
              const rawDisponibilites = JSON.parse(intervenant.disponibilite);
              
              Object.keys(rawDisponibilites).forEach(jour => {
                const jourKey = jour.toLowerCase();
                const dispo = rawDisponibilites[jour];
                
                if (dispo && dispo.debut && dispo.fin) {
                  disponibilitesIntervenant[jourKey] = {
                    debut: dispo.debut,
                    fin: dispo.fin
                  };
                }
              });
            } catch (parseError) {
            }
          }

          const dispoJour = disponibilitesIntervenant[jourSemaine];
          
          if (dispoJour && dispoJour.debut && dispoJour.fin) {
            const ouvertureSalon = timeToMinutes(horaireSalon.heure_ouverture);
            const fermetureSalon = timeToMinutes(horaireSalon.heure_fermeture);
            const debutIntervenant = timeToMinutes(dispoJour.debut);
            const finIntervenant = timeToMinutes(dispoJour.fin);
            
            const ouvertureEffective = Math.max(ouvertureSalon, debutIntervenant);
            const fermetureEffective = Math.min(fermetureSalon, finIntervenant);
            
            const pauseDebut = horaireSalon.pause_debut ? timeToMinutes(horaireSalon.pause_debut) : null;
            const pauseFin = horaireSalon.pause_fin ? timeToMinutes(horaireSalon.pause_fin) : null;
            
            let creneauxPossibles = [];
            
            if (pauseDebut && pauseFin) {
              if (ouvertureEffective < pauseDebut) {
                const finAvantPause = Math.min(pauseDebut, fermetureEffective);
                if (ouvertureEffective < finAvantPause) {
                  creneauxPossibles.push({
                    debut: minutesToTime(ouvertureEffective),
                    fin: minutesToTime(finAvantPause),
                    type: 'avant_pause'
                  });
                }
              }
              
              if (pauseFin < fermetureEffective) {
                const debutApresPause = Math.max(pauseFin, ouvertureEffective);
                if (debutApresPause < fermetureEffective) {
                  creneauxPossibles.push({
                    debut: minutesToTime(debutApresPause),
                    fin: minutesToTime(fermetureEffective),
                    type: 'apres_pause'
                  });
                }
              }
            } else {
              if (ouvertureEffective < fermetureEffective) {
                creneauxPossibles.push({
                  debut: minutesToTime(ouvertureEffective),
                  fin: minutesToTime(fermetureEffective),
                  type: 'sans_pause'
                });
              }
            }
            
            if (creneauxPossibles.length > 0) {
              intervenantsDisponibles.push({
                id: intervenant.id,
                prenom: intervenant.prenom,
                nom: intervenant.nom,
                type: intervenant.type,
                disponibilite: dispoJour,
                creneaux: creneauxPossibles,
                intersection: {
                  debut: minutesToTime(ouvertureEffective),
                  fin: minutesToTime(fermetureEffective)
                }
              });
            }
          }
        });

        const disponible = intervenantsDisponibles.length > 0;
        
        res.json({
          disponible,
          jour: jourSemaine,
          date: date,
          intervenants_disponibles: intervenantsDisponibles,
          horaire_salon: {
            ouverture: horaireSalon.heure_ouverture,
            fermeture: horaireSalon.heure_fermeture,
            pause: horaireSalon.pause_debut ? {
              debut: horaireSalon.pause_debut,
              fin: horaireSalon.pause_fin
            } : null
          },
          stats: {
            total_intervenants: intervenants.length,
            intervenants_disponibles: intervenantsDisponibles.length,
            salon_ouvert: true
          }
        });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route simple pour vérifier uniquement les jours ouverts
app.get('/api/jours-ouverts/:id_prestataire', (req, res) => {
  const id_prestataire = req.params.id_prestataire;

  const query = `
    SELECT hs.jour_semaine, hs.is_ferme
    FROM entreprise e
    JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
    WHERE e.id_prestataire = ?
    ORDER BY FIELD(hs.jour_semaine, 'lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche')
  `;

  db.query(query, [id_prestataire], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    const joursOuverts = {};
    results.forEach(row => {
      joursOuverts[row.jour_semaine] = !row.is_ferme;
    });

    res.json({ jours_ouverts: joursOuverts });
  });
});

app.get('/api/reservations-intervenant', async (req, res) => {
  try {
    const { date, intervenant_id, type, prestataire_id } = req.query;
    
    if (!date || !intervenant_id || !prestataire_id) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    let query = '';
    let params = [date, prestataire_id];

    if (type === 'prestataire') {
      query = `
        SELECT 
          TIME_FORMAT(r.heure_debut, '%H:%i') as heure_debut,
          TIME_FORMAT(r.heure_fin, '%H:%i') as heure_fin,
          p.temps
        FROM reservation r
        JOIN prestation p ON r.id_prestation = p.id_prestation
        WHERE r.date_reservation = ?
          AND r.id_prestataire = ?
          AND r.statut = 'reservé'
          AND r.annulee = 0
          AND r.supprimee = 0
        ORDER BY r.heure_debut
      `;
      params = [date, intervenant_id];
    } else {
      query = `
        SELECT 
          TIME_FORMAT(r.heure_debut, '%H:%i') as heure_debut,
          TIME_FORMAT(r.heure_fin, '%H:%i') as heure_fin,
          p.temps
        FROM reservation r
        JOIN prestation p ON r.id_prestation = p.id_prestation
        WHERE r.date_reservation = ?
          AND r.id_employe = ?
          AND r.statut = 'reservé'
          AND r.annulee = 0
          AND r.supprimee = 0
        ORDER BY r.heure_debut
      `;
      params = [date, intervenant_id];
    }

    db.query(query, params, (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }
      
      res.json({ 
        reservations: results,
        count: results.length
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/horaires/:id_prestataire', (req, res) => {
  const id_prestataire = req.params.id_prestataire;

  const query = `
    SELECT hs.jour_semaine, hs.heure_ouverture, hs.heure_fermeture, 
           hsp.heure_debut AS pause_debut, hsp.heure_fin AS pause_fin,
           hs.is_ferme
    FROM entreprise e
    JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
    LEFT JOIN horaires_salon_pause hsp ON hs.id = hsp.salon_id AND hs.jour_semaine = hsp.jour_semaine
    WHERE e.id_prestataire = ?
    ORDER BY FIELD(hs.jour_semaine, 'lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche');
  `;

  db.query(query, [id_prestataire], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Erreur serveur' });
      return;
    }

    const formattedResults = results.map(horaire => {
      const nouveauFormat = {
        jour: horaire.jour_semaine,
        heure_ouverture: horaire.heure_ouverture,
        heure_fermeture: horaire.heure_fermeture,
        pause_debut: horaire.pause_debut,
        pause_fin: horaire.pause_fin,
        is_ferme: horaire.is_ferme
      };

      const heures = horaire.is_ferme ? [] : (() => {
        const heuresArray = [];
        const start = parseInt(horaire.heure_ouverture);
        const end = parseInt(horaire.heure_fermeture);
        
        for (let hour = start; hour < end; hour++) {
          heuresArray.push(`${hour}h00`);
          if (hour + 0.5 < end) {
            heuresArray.push(`${hour}h30`);
          }
        }
        return heuresArray;
      })();

      return {
        ...nouveauFormat,
        heures
      };
    });

    res.status(200).json(formattedResults);
  });
});

function genererCreneauxAvecDuree(horaire, reservations, dureeMinutes) {
  const creneaux = [];
  
  const ouvertureMin = convertirHeureEnMinutes(horaire.heure_ouverture);
  const fermetureMin = convertirHeureEnMinutes(horaire.fermeture);
  const pauseDebutMin = horaire.pause_debut ? convertirHeureEnMinutes(horaire.pause_debut) : null;
  const pauseFinMin = horaire.pause_fin ? convertirHeureEnMinutes(horaire.pause_fin) : null;

  const plagesOccupees = reservations.map(res => ({
    debut: convertirHeureEnMinutes(res.heure_debut),
    fin: convertirHeureEnMinutes(res.heure_fin)
  }));

  for (let time = ouvertureMin; time <= fermetureMin - dureeMinutes; time += dureeMinutes) {
    const creneauFin = time + dureeMinutes;
    
    const estPause = pauseDebutMin && pauseFinMin && 
                    time < pauseFinMin && creneauFin > pauseDebutMin;
    
    const estOccupe = plagesOccupees.some(occupe => 
      time < occupe.fin && creneauFin > occupe.debut
    );

    if (!estOccupe && !estPause) {
      creneaux.push({
        heure: convertirMinutesEnHeure(time),
        heure_fin: convertirMinutesEnHeure(creneauFin),
        decimal: time / 60
      });
    }
  }

  return creneaux;
}

function convertirHeureEnMinutes(heureStr) {
  const [heures, minutes] = heureStr.split(':').map(Number);
  return heures * 60 + minutes;
}

function convertirMinutesEnHeure(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

app.get('/api/employes', (req, res) => {
  try {
    const { id_prestataire, categorie } = req.query;

    if (!id_prestataire) {
      return res.status(400).json({ error: 'ID prestataire requis' });
    }

    const baseQuery = `
      SELECT 
        p.id_prestataire as id,
        p.nom,
        p.prenom,
        p.categorie,
        p.disponibilite,
        'prestataire' as role
      FROM prestataire p
      WHERE p.id_prestataire = ?
        AND (p.conge = 0 OR p.conge IS NULL)

      UNION ALL

      SELECT 
        e.id_employe as id,
        e.nom,
        e.prenom,
        e.categorie,
        e.disponibilite,
        'employe' as role
      FROM employe e
      WHERE e.id_prestataire = ?
        AND (e.conge = 0 OR e.conge IS NULL)
        AND e.supprime = 0
    `;

    db.query(baseQuery, [id_prestataire, id_prestataire], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      let filteredResults = results;
      if (categorie) {
        filteredResults = results.filter(person => 
          person.categorie && person.categorie.toLowerCase().includes(categorie.toLowerCase())
        );
      }

      const responseData = {
        prestataire: filteredResults.find(r => r.role === 'prestataire') || null,
        employes: filteredResults.filter(r => r.role === 'employe')
      };

      res.status(200).json(responseData);
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const reservationId = req.params.id;
    const {
      heure_debut,
      heure_fin,
      statut,
      commentaire,
    } = req.body;

    const updateReservationQuery = `
      UPDATE reservation 
      SET heure_debut = ?, heure_fin = ?, statut = ?, commentaire = ?, updated_at = NOW()
      WHERE id_reservation = ?
    `;

    db.query(updateReservationQuery, [
      heure_debut,
      heure_fin,
      statut,
      commentaire || null,
      reservationId
    ], (error, result) => {
      if (error) {
        return res.status(500).json({ 
          error: 'Erreur mise à jour réservation',
          details: error.message 
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Réservation non trouvée' });
      }

      res.json({ 
        success: true,
        message: 'Réservation modifiée avec succès'
      });
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

app.post('/api/reservationprestanewclients', async (req, res) => {
  try {
    const { nom, prenom, mail, numero, adresse } = req.body;

    if (!nom || !prenom || (!mail && !numero)) {
      return res.status(400).json({ 
        error: 'Nom, prénom et au moins un contact (mail ou numéro) sont obligatoires' 
      });
    }

    const cleanNumero = numero ? numero.replace(/\D/g, '') : null;

    const [existingClient] = await db.query(
      'SELECT id_client FROM client WHERE mail = ? OR numero = ? LIMIT 1',
      [mail, cleanNumero]
    );

    if (existingClient) {
      return res.status(200).json({ 
        success: true,
        id_client: existingClient.id_client,
        isExisting: true
      });
    }

    const [result] = await db.query(
      `INSERT INTO client SET ?`,
      {
        nom,
        prenom,
        mail: mail || null,
        numero: cleanNumero || null,
        adresse: adresse || null,
        genre: null,
        date_naissance: null,
        mot_de_passe: null,
        ville: null,
        code_postal: null,
        created_at: new Date()
      }
    );

    res.status(201).json({
      success: true,
      id_client: result.insertId,
      isExisting: false
    });

  } catch (error) {
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la création du client' 
    });
  }
});


// Endpoint GET pour récupérer les prestations
app.get('/api/prestationsreservation', (req, res) => {
  const { id_prestataire } = req.query;
  
  if (!id_prestataire) {
    return res.status(400).json({ error: 'ID prestataire requis' });
  }

  const query = `
    SELECT 
      id_prestation, 
      titre, 
      prix, 
      categorie,
      temps,
      description
    FROM prestation 
    WHERE id_prestataire = ? 
    AND supprime = 0
    ORDER BY categorie, titre
  `;

  db.query(query, [id_prestataire], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de base de données' });
    }

    const categories = [...new Set(
      results
        .map(p => p.categorie)
        .filter(cat => cat && cat.trim() !== '')
    )];
    
    res.json({
      prestations: results,
      categories
    });
  });
});

// Si vous avez un endpoint pour récupérer une prestation par ID
app.get('/api/prestation/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      id_prestation, 
      titre, 
      prix, 
      categorie,
      temps,
      description
    FROM prestation 
    WHERE id_prestation = ?
  `;

  db.query(query, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de base de données' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Prestation non trouvée' });
    }

    res.json(results[0]);
  });
});

app.get('/api/search-client', (req, res) => {
  const { mail, numero } = req.query;

  if (!mail && !numero) {
    return res.status(400).json({ error: 'Paramètre mail ou numero requis' });
  }

  let query;
  const params = [];
  
  if (mail) {
    query = 'SELECT * FROM client WHERE mail = ?';
    params.push(mail);
  } else {
    const cleanNumero = numero.replace(/\D/g, '');
    query = 'SELECT * FROM client WHERE numero LIKE ?';
    params.push(`%${cleanNumero}%`);
  }
  
  db.query(query, params, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    res.json({ client: results[0] || null });
  });
});

// Endpoint pour récupérer les disponibilités d'un intervenant - AVEC INTERSECTION HORAIRES
app.get('/api/disponibilites-intervenant', async (req, res) => {
  try {
    const { prestataire_id, employe_id, date, duree_minutes } = req.query;
    
    if (!prestataire_id || !date || !duree_minutes) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const duree = parseInt(duree_minutes);
    const selectedDate = new Date(date);
    const jourSemaine = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    const horairesQuery = `
      SELECT hs.jour_semaine, hs.heure_ouverture, hs.heure_fermeture, 
             hsp.heure_debut as pause_debut, hsp.heure_fin as pause_fin,
             hs.is_ferme
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      LEFT JOIN horaires_salon_pause hsp ON hs.id = hsp.salon_id AND hs.jour_semaine = hsp.jour_semaine
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;

    db.query(horairesQuery, [prestataire_id, jourSemaine], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0 || results[0].is_ferme) {
        return res.json({ 
          disponibilites: [],
          message: 'Salon fermé ce jour'
        });
      }

      const horaire = results[0];

      let reservationsQuery = `
        SELECT r.heure_debut, r.heure_fin 
        FROM reservation r
        WHERE r.date_reservation = ? 
        AND r.statut = 'reservé'
        AND r.annulee = 0
        AND r.supprimee = 0
      `;
      
      let params = [date];

      if (employe_id === "prestataire") {
        reservationsQuery += ` AND r.id_prestataire = ?`;
        params.push(prestataire_id);
      } else {
        reservationsQuery += ` AND r.id_employe = ?`;
        params.push(employe_id);
      }

      db.query(reservationsQuery, params, (error, reservations) => {
        if (error) {
          return res.status(500).json({ error: 'Erreur reservations' });
        }

        const creneauxDisponibles = calculerCreneauxAvecDureeExacte(horaire, reservations, duree);
        
        res.json({
          disponibilites: creneauxDisponibles,
          count: creneauxDisponibles.length
        });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer les disponibilités d'un intervenant POUR LE CALENDRIER
app.get('/api/disponibilites-intervenant-calendrier', (req, res) => {
  const { prestataire_id, employe_id } = req.query;
  
  if (!prestataire_id) {
    return res.status(400).json({ error: 'ID prestataire requis' });
  }

  const convertirFormatDisponibilites = (rawDisponibilites) => {
    if (!rawDisponibilites) return {};
    
    if (rawDisponibilites.lundi && rawDisponibilites.lundi.debut) {
      return rawDisponibilites;
    }
    
    const disponibilitesConverties = {};
    const joursMapping = {
      'lundi': 'Lundi', 'mardi': 'Mardi', 'mercredi': 'Mercredi',
      'jeudi': 'Jeudi', 'vendredi': 'Vendredi', 'samedi': 'Samedi', 'dimanche': 'Dimanche'
    };
    
    Object.keys(joursMapping).forEach(jourFr => {
      const jourKey = joursMapping[jourFr];
      
      if (rawDisponibilites[jourKey] && rawDisponibilites[jourKey].disponible === true) {
        const dispo = rawDisponibilites[jourKey];
        
        const heureDebut = dispo.heure_debut ? 
          `${dispo.heure_debut.toString().padStart(2, '0')}:00` : null;
        const heureFin = dispo.heure_fin ? 
          `${dispo.heure_fin.toString().padStart(2, '0')}:00` : null;
        
        if (heureDebut && heureFin) {
          disponibilitesConverties[jourFr] = {
            debut: heureDebut,
            fin: heureFin
          };
        }
      }
    });
    
    return disponibilitesConverties;
  };

  if (!employe_id || employe_id === 'prestataire') {
    const query = `
      SELECT disponibilite 
      FROM prestataire 
      WHERE id_prestataire = ?
    `;

    db.query(query, [prestataire_id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Prestataire non trouvé' });
      }

      const prestataire = results[0];
      let disponibilites = {};
      
      try {
        if (prestataire.disponibilite && typeof prestataire.disponibilite === 'string') {
          disponibilites = JSON.parse(prestataire.disponibilite);
        } else if (prestataire.disponibilite && typeof prestataire.disponibilite === 'object') {
          disponibilites = prestataire.disponibilite;
        } else {
          disponibilites = {};
        }
      } catch (parseError) {
        disponibilites = {};
      }

      const disponibilitesConverties = convertirFormatDisponibilites(disponibilites);
      
      res.json({
        disponibilites: disponibilitesConverties,
        type: 'prestataire'
      });
    });
  } else {
    const query = `
      SELECT disponibilite 
      FROM employe 
      WHERE id_employe = ? 
      AND id_prestataire = ?
      AND supprime = 0
    `;

    db.query(query, [employe_id, prestataire_id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Employé non trouvé' });
      }

      const employe = results[0];
      let disponibilites = {};
      
      try {
        if (employe.disponibilite && typeof employe.disponibilite === 'string') {
          disponibilites = JSON.parse(employe.disponibilite);
        } else if (employe.disponibilite && typeof employe.disponibilite === 'object') {
          disponibilites = employe.disponibilite;
        } else {
          disponibilites = {};
        }
      } catch (parseError) {
        disponibilites = {};
      }

      const disponibilitesConverties = convertirFormatDisponibilites(disponibilites);
      
      res.json({
        disponibilites: disponibilitesConverties,
        type: 'employe'
      });
    });
  }
});

// NOUVELLE FONCTION : Conversion du format employé vers format standard (améliorée)
function convertirFormatDisponibilites(rawDisponibilites) {
  const disponibilitesConverties = {};
  
  if (rawDisponibilites.lundi && rawDisponibilites.lundi.debut) {
    return rawDisponibilites;
  }
  
  if (!rawDisponibilites || Object.keys(rawDisponibilites).length === 0) {
    return {};
  }
  
  const joursMapping = {
    'lundi': 'lundi', 'mardi': 'mardi', 'mercredi': 'mercredi', 
    'jeudi': 'jeudi', 'vendredi': 'vendredi', 'samedi': 'samedi', 'dimanche': 'dimanche'
  };
  
  Object.keys(joursMapping).forEach(jourFr => {
    const jourKey = jourFr.charAt(0).toUpperCase() + jourFr.slice(1);
    
    if (rawDisponibilites[jourKey] && rawDisponibilites[jourKey].disponible) {
      const dispo = rawDisponibilites[jourKey];
      
      const heureDebut = dispo.heure_debut ? 
        `${dispo.heure_debut.toString().padStart(2, '0')}:00` : null;
      const heureFin = dispo.heure_fin ? 
        `${dispo.heure_fin.toString().padStart(2, '0')}:00` : null;
      
      if (heureDebut && heureFin) {
        disponibilitesConverties[jourFr] = {
          debut: heureDebut,
          fin: heureFin
        };
      }
    } else if (rawDisponibilites[jourKey] && rawDisponibilites[jourKey].disponible === false) {
      disponibilitesConverties[jourFr] = null;
    }
  });
  
  return disponibilitesConverties;
}

// NOUVELLE FONCTION AVEC DURÉE EXACTE
function calculerCreneauxAvecDureeExacte(horaireSalon, reservations, dureeMinutes, disponibilitesIntervenant = null) {
  const creneaux = [];
  
  const ouvertureSalonMin = timeToMinutes(horaireSalon.heure_ouverture);
  const fermetureSalonMin = timeToMinutes(horaireSalon.heure_fermeture);
  
  let ouvertureIntervenantMin = ouvertureSalonMin;
  let fermetureIntervenantMin = fermetureSalonMin;
  
  if (disponibilitesIntervenant && disponibilitesIntervenant.debut && disponibilitesIntervenant.fin) {
    ouvertureIntervenantMin = timeToMinutes(disponibilitesIntervenant.debut);
    fermetureIntervenantMin = timeToMinutes(disponibilitesIntervenant.fin);
  }
  
  const ouvertureEffective = Math.max(ouvertureSalonMin, ouvertureIntervenantMin);
  const fermetureEffective = Math.min(fermetureSalonMin, fermetureIntervenantMin);
  
  if (ouvertureEffective >= fermetureEffective) {
    return creneaux;
  }

  const pauseDebutMin = horaireSalon.pause_debut ? timeToMinutes(horaireSalon.pause_debut) : null;
  const pauseFinMin = horaireSalon.pause_fin ? timeToMinutes(horaireSalon.pause_fin) : null;

  const plagesOccupees = reservations.map(res => ({
    debut: timeToMinutes(res.heure_debut),
    fin: timeToMinutes(res.heure_fin)
  }));

  const periodes = [];
  
  if (pauseDebutMin && pauseFinMin) {
    if (ouvertureEffective < pauseDebutMin) {
      periodes.push({ debut: ouvertureEffective, fin: Math.min(pauseDebutMin, fermetureEffective) });
    }
    if (pauseFinMin < fermetureEffective) {
      periodes.push({ debut: Math.max(pauseFinMin, ouvertureEffective), fin: fermetureEffective });
    }
  } else {
    periodes.push({ debut: ouvertureEffective, fin: fermetureEffective });
  }

  periodes.forEach((periode) => {
    for (let time = periode.debut; time <= periode.fin - dureeMinutes; time += dureeMinutes) {
      const creneauFin = time + dureeMinutes;
      
      const estOccupe = plagesOccupees.some(occupe => 
        time < occupe.fin && creneauFin > occupe.debut
      );

      if (!estOccupe) {
        creneaux.push({
          heure: minutesToTime(time),
          heure_fin: minutesToTime(creneauFin),
          decimal: time / 60
        });
      }
    }
  });

  return creneaux;
}

// FONCTIONS DE CONVERSION
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const cleanTime = timeStr.split(':').slice(0, 2).join(':');
  const [hours, minutes] = cleanTime.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculerDisponibilitesAvecDuree(horaire, reservations, dureeMinutes) {
  const creneauxDisponibles = [];
  
  if (!horaire || horaire.is_ferme) {
    return creneauxDisponibles;
  }

  const ouvertureMin = timeToMinutes(horaire.heure_ouverture);
  const fermetureMin = timeToMinutes(horaire.heure_fermeture);
  const pauseDebutMin = horaire.pause_debut ? timeToMinutes(horaire.pause_debut) : null;
  const pauseFinMin = horaire.pause_fin ? timeToMinutes(horaire.pause_fin) : null;

  const plagesOccupees = reservations.map(res => {
    const debut = timeToMinutes(res.heure_debut);
    const fin = timeToMinutes(res.heure_fin);
    return { debut, fin };
  });

  const periodes = [];
  
  if (pauseDebutMin && pauseFinMin) {
    if (ouvertureMin < pauseDebutMin) {
      periodes.push({ debut: ouvertureMin, fin: pauseDebutMin });
    }
    if (pauseFinMin < fermetureMin) {
      periodes.push({ debut: pauseFinMin, fin: fermetureMin });
    }
  } else {
    periodes.push({ debut: ouvertureMin, fin: fermetureMin });
  }

  periodes.forEach((periode) => {
    for (let time = periode.debut; time <= periode.fin - dureeMinutes; time += dureeMinutes) {
      const creneauFin = time + dureeMinutes;
      
      if (creneauFin > periode.fin) continue;
      
      const estOccupe = plagesOccupees.some(occupe => 
        time < occupe.fin && creneauFin > occupe.debut
      );

      if (!estOccupe) {
        creneauxDisponibles.push({
          heure: minutesToTime(time),
          heure_fin: minutesToTime(creneauFin),
          decimal: time / 60
        });
      }
    }
  });

  return creneauxDisponibles;
}

// Fonction helper pour calculer les disponibilités avec durée spécifique
function calculerDisponibilitesAvecDureeEtReservations(horaire, reservations, dureeMinutes) {
  const creneauxDisponibles = [];
  
  const dureeHeures = dureeMinutes / 60;
  const debut = convertirHeureEnDecimal(horaire.heure_ouverture);
  const fin = convertirHeureEnDecimal(horaire.heure_fermeture);

  const pauseDebut = horaire.pause_debut ? convertirHeureEnDecimal(horaire.pause_debut) : null;
  const pauseFin = horaire.pause_fin ? convertirHeureEnDecimal(horaire.pause_fin) : null;

  const plagesOccupees = reservations.map(res => {
    const start = convertirHeureEnDecimal(res.heure_debut);
    const dureeResHeures = res.temps / 60;
    const end = start + dureeResHeures;
    
    return { start, end };
  });

  const intervalle = dureeHeures;
  
  for (let heure = debut; heure <= fin - intervalle; heure += intervalle) {
    const creneau = {
      start: heure,
      end: heure + intervalle
    };

    const estPause = pauseDebut && pauseFin &&
      creneau.start < pauseFin && creneau.end > pauseDebut;

    const estOccupe = plagesOccupees.some(occupe => 
      creneau.start < occupe.end && creneau.end > occupe.start
    );

    if (!estOccupe && !estPause) {
      creneauxDisponibles.push({
        heure: convertirDecimalEnHeure(creneau.start),
        decimal: creneau.start,
        heure_fin: convertirDecimalEnHeure(creneau.end)
      });
    }
  }

  return creneauxDisponibles;
}

// Fonctions utilitaires
function convertirHeureEnDecimal(heureStr) {
  const [heures, minutes] = heureStr.split(':').map(Number);
  return heures + (minutes / 60);
}

function convertirDecimalEnHeure(decimal) {
  const heures = Math.floor(decimal);
  const minutes = Math.round((decimal - heures) * 60);
  return `${heures.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Fonction helper pour calculer les disponibilités avec durée spécifique
function calculerDisponibilitesAvecDuree(horaire, reservations, dureeMinutes) {
  const creneauxDisponibles = [];
  
  if (!horaire || !horaire.heure_ouverture || !horaire.heure_fermeture) {
    return creneauxDisponibles;
  }

  const ouvertureMin = convertirHeureEnMinutes(horaire.heure_ouverture);
  const fermetureMin = convertirHeureEnMinutes(horaire.heure_fermeture);
  const pauseDebutMin = horaire.pause_debut ? convertirHeureEnMinutes(horaire.pause_debut) : null;
  const pauseFinMin = horaire.pause_fin ? convertirHeureEnMinutes(horaire.pause_fin) : null;

  const plagesOccupees = reservations.map(res => {
    const debut = convertirHeureEnMinutes(res.heure_debut);
    const fin = convertirHeureEnMinutes(res.heure_fin);
    return { debut, fin };
  });

  for (let time = ouvertureMin; time <= fermetureMin - dureeMinutes; time += 15) {
    const creneauFin = time + dureeMinutes;
    
    if (creneauFin > fermetureMin) continue;
    
    const estPause = pauseDebutMin && pauseFinMin && 
                    time < pauseFinMin && creneauFin > pauseDebutMin;
    
    const estOccupe = plagesOccupees.some(occupe => 
      time < occupe.fin && creneauFin > occupe.debut
    );

    if (!estOccupe && !estPause) {
      creneauxDisponibles.push({
        heure: convertirMinutesEnHeure(time),
        heure_fin: convertirMinutesEnHeure(creneauFin),
        decimal: time / 60
      });
    }
  }

  return creneauxDisponibles;
}

function convertirHeureEnMinutes(heureStr) {
  if (!heureStr || heureStr === '00:00:00') {
    return 0;
  }
  
  const heureNettoyee = heureStr.split(':').slice(0, 2).join(':');
  const [heures, minutes] = heureNettoyee.split(':').map(Number);
  
  return heures * 60 + minutes;
}

function convertirMinutesEnHeure(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Endpoint pour vérifier la disponibilité d'une date - CORRECTION DÉCALAGE DATE
app.get('/api/verifier-disponibilite-date', async (req, res) => {
  try {
    const { prestataire_id, employe_id, date, duree_minutes, categorie } = req.query;
    
    if (!prestataire_id || !date) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const duree = parseInt(duree_minutes) || 0;
    
    const selectedDate = new Date(date);
    const dateNormalisee = new Date(Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate()
    ));
    
    const datePourRequete = dateNormalisee.toISOString().split('T')[0];
    const jourSemaine = dateNormalisee.toLocaleDateString('fr-FR', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();

    const horaireQuery = `
      SELECT hs.jour_semaine, hs.heure_ouverture, hs.heure_fermeture, 
             hsp.heure_debut as pause_debut, hsp.heure_fin as pause_fin,
             hs.is_ferme
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      LEFT JOIN horaires_salon_pause hsp ON hs.id = hsp.salon_id AND hs.jour_semaine = hsp.jour_semaine
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;
    
    db.query(horaireQuery, [prestataire_id, jourSemaine], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0) {
        return res.json({ 
          status: 'ferme',
          message: 'Aucun horaire défini pour ce jour'
        });
      }

      const horaire = results[0];

      if (horaire.is_ferme) {
        return res.json({ 
          status: 'ferme',
          message: 'Entreprise fermée ce jour'
        });
      }

      if (!duree_minutes || duree === 0) {
        return res.json({ 
          status: 'disponible',
          message: 'Jour disponible (aucune prestation sélectionnée)'
        });
      }

      if (employe_id) {
        const checkDisponibiliteIntervenant = () => {
          return new Promise((resolve, reject) => {
            let query = '';
            let params = [];

            if (employe_id === "prestataire") {
              query = 'SELECT disponibilite FROM prestataire WHERE id_prestataire = ?';
              params = [prestataire_id];
            } else {
              query = 'SELECT disponibilite FROM employe WHERE id_employe = ? AND id_prestataire = ?';
              params = [employe_id, prestataire_id];
            }

            db.query(query, params, (error, results) => {
              if (error) {
                return reject(error);
              }

              if (results.length === 0) {
                return resolve(false);
              }

              const disponibiliteStr = results[0].disponibilite;
              
              if (!disponibiliteStr) {
                return resolve(true);
              }

              try {
                const rawDisponibilites = JSON.parse(disponibiliteStr);
                const disponibilitesConverties = convertirFormatDisponibilites(rawDisponibilites);
                
                const dispoJour = disponibilitesConverties[jourSemaine];
                const estDisponible = dispoJour && dispoJour.debut && dispoJour.fin;
                
                resolve(estDisponible);
                
              } catch (parseError) {
                resolve(true);
              }
            });
          });
        };

        checkDisponibiliteIntervenant().then(estDisponibleIntervenant => {
          if (!estDisponibleIntervenant) {
            return res.json({ 
              status: 'indisponible_intervenant',
              message: 'Intervenant non disponible ce jour'
            });
          }

          verifierCreneauxDisponibles(prestataire_id, employe_id, datePourRequete, duree, horaire, res);
        }).catch(error => {
          res.status(500).json({ error: 'Erreur vérification disponibilité' });
        });

      } else {
        verifierCreneauxDisponibles(prestataire_id, null, datePourRequete, duree, horaire, res);
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour vérifier si un intervenant a des créneaux disponibles un jour donné
function verifierCreneauxDisponiblesIntervenant(horaire, reservations, dureeMinutes) {
  if (!horaire || horaire.is_ferme) {
    return false;
  }

  const ouvertureMin = timeToMinutes(horaire.heure_ouverture);
  const fermetureMin = timeToMinutes(horaire.heure_fermeture);
  const pauseDebutMin = horaire.pause_debut ? timeToMinutes(horaire.pause_debut) : null;
  const pauseFinMin = horaire.pause_fin ? timeToMinutes(horaire.pause_fin) : null;

  const plagesOccupees = reservations.map(res => ({
    debut: timeToMinutes(res.heure_debut),
    fin: timeToMinutes(res.heure_fin)
  }));

  const periodes = [];
  
  if (pauseDebutMin && pauseFinMin) {
    if (ouvertureMin < pauseDebutMin) {
      periodes.push({ debut: ouvertureMin, fin: pauseDebutMin });
    }
    if (pauseFinMin < fermetureMin) {
      periodes.push({ debut: pauseFinMin, fin: fermetureMin });
    }
  } else {
    periodes.push({ debut: ouvertureMin, fin: fermetureMin });
  }

  for (let periode of periodes) {
    for (let time = periode.debut; time <= periode.fin - dureeMinutes; time += dureeMinutes) {
      const creneauFin = time + dureeMinutes;
      
      if (creneauFin > periode.fin) continue;
      
      const estOccupe = plagesOccupees.some(occupe => 
        time < occupe.fin && creneauFin > occupe.debut
      );

      if (!estOccupe) {
        return true;
      }
    }
  }

  return false;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  
  const cleanTime = timeStr.split(':').slice(0, 2).join(':');
  const [hours, minutes] = cleanTime.split(':').map(Number);
  
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Fonction pour vérifier les créneaux disponibles
function verifierCreneauxDisponibles(prestataire_id, employe_id, date, duree, horaire, res) {
  // Récupérer les réservations existantes
  let reservationsQuery = `
    SELECT r.heure_debut, r.heure_fin 
    FROM reservation r
    WHERE r.date_reservation = ? 
    AND r.statut = 'reservé'
    AND r.annulee = 0
    AND r.supprimee = 0
  `;
  
  let params = [date];

  if (employe_id && employe_id !== "prestataire") {
    reservationsQuery += ` AND r.id_employe = ?`;
    params.push(employe_id);
  } else if (employe_id === "prestataire") {
    reservationsQuery += ` AND r.id_prestataire = ?`;
    params.push(prestataire_id);
  } else {
    // Si aucun intervenant spécifié, prendre toutes les réservations du prestataire
    reservationsQuery += ` AND (r.id_prestataire = ? OR r.id_employe IN (
      SELECT id_employe FROM employe WHERE id_prestataire = ?
    ))`;
    params.push(prestataire_id, prestataire_id);
  }

  db.query(reservationsQuery, params, (error, reservations) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur reservations' });
    }

    // Vérifier s'il reste des créneaux disponibles
    const hasCreneauxDisponibles = verifierCreneauxDisponiblesIntervenant(horaire, reservations, duree);

    if (hasCreneauxDisponibles) {
      res.json({ 
        status: 'disponible',
        message: 'Créneaux disponibles'
      });
    } else {
      res.json({ 
        status: 'indisponible',
        message: 'Aucun créneau disponible pour cette durée'
      });
    }
  });
}

// Fonctions helper pour les calculs de disponibilité
async function calculerDisponibilitesPourIntervenant(prestataireId, employeId, date, duree) {
  return [];
}

async function calculerDisponibilitesPourCategorie(prestataireId, categorie, date, duree) {
  return [];
}

async function calculerDisponibilitesGenerales(prestataireId, date, duree) {
  return [];
}

// Endpoint pour récupérer les jours fermés
app.get('/api/jours-fermes/:id_prestataire', (req, res) => {
  const id_prestataire = req.params.id_prestataire;

  const query = `
    SELECT hs.jour_semaine, hs.is_ferme
    FROM entreprise e
    JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
    WHERE e.id_prestataire = ?
    ORDER BY FIELD(hs.jour_semaine, 'lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche')
  `;

  db.query(query, [id_prestataire], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Erreur serveur' });
      return;
    }

    res.status(200).json(results);
  });
});

// Nouvel endpoint pour récupérer les disponibilités par date
app.get('/api/disponibilites-par-date', async (req, res) => {
  try {
    const { prestataire_id, date } = req.query;
    
    if (!prestataire_id || !date) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    // 1. Récupérer les horaires du salon pour ce jour
    const jourSemaine = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    
    const horaireQuery = `
      SELECT hs.heure_ouverture, hs.heure_fermeture, hs.is_ferme,
             hsp.heure_debut as pause_debut, hsp.heure_fin as pause_fin
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      LEFT JOIN horaires_salon_pause hsp ON hs.id = hsp.salon_id AND hs.jour_semaine = hsp.jour_semaine
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;
    
    const [horaireResult] = await db.query(horaireQuery, [prestataire_id, jourSemaine]);
    
    if (horaireResult.length === 0 || horaireResult[0].is_ferme) {
      return res.json({ 
        status: 'ferme',
        message: 'Entreprise fermée ce jour'
      });
    }

    const horaire = horaireResult[0];

    // 2. Récupérer toutes les réservations actives pour cette date
    const reservationsQuery = `
      SELECT r.*, p.titre as prestation_titre, p.temps, p.categorie,
             COALESCE(e.prenom, pr.prenom) as intervenant_prenom,
             COALESCE(e.nom, pr.nom) as intervenant_nom,
             CASE WHEN r.id_employe IS NOT NULL THEN 'employe' ELSE 'prestataire' END as type_intervenant
      FROM reservation r
      JOIN prestation p ON r.id_prestation = p.id_prestation
      LEFT JOIN employe e ON r.id_employe = e.id_employe
      LEFT JOIN prestataire pr ON r.id_prestataire = pr.id_prestataire
      WHERE r.date_reservation = ? 
        AND r.statut = 'reservé'
        AND r.annulee = 0
        AND r.supprimee = 0
        AND (r.id_prestataire = ? OR e.id_prestataire = ?)
    `;

    const [reservations] = await db.query(reservationsQuery, [date, prestataire_id, prestataire_id]);

    // 3. Récupérer tous les intervenants disponibles
    const intervenantsQuery = `
      (SELECT id_prestataire as id, prenom, nom, categorie, 'prestataire' as type
       FROM prestataire 
       WHERE id_prestataire = ? AND conge = 0)
      UNION
      (SELECT id_employe as id, prenom, nom, categorie, 'employe' as type
       FROM employe 
       WHERE id_prestataire = ? AND conge = 0 AND supprime = 0)
    `;

    const [intervenants] = await db.query(intervenantsQuery, [prestataire_id, prestataire_id]);

    // 4. Récupérer les prestations disponibles
    const prestationsQuery = `
      SELECT id_prestation, titre, prix, temps, categorie
      FROM prestation 
      WHERE id_prestataire = ? AND supprime = 0
      ORDER BY categorie, titre
    `;

    const [prestations] = await db.query(prestationsQuery, [prestataire_id]);

    res.json({
      status: 'disponible',
      horaire: {
        ouverture: horaire.heure_ouverture,
        fermeture: horaire.heure_fermeture,
        pause: horaire.pause_debut ? {
          debut: horaire.pause_debut,
          fin: horaire.pause_fin
        } : null
      },
      reservations,
      intervenants,
      prestations
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour vérifier la disponibilité d'un intervenant spécifique
app.get('/api/verifier-disponibilite-intervenant', async (req, res) => {
  try {
    const { intervenant_id, type_intervenant, date, duree_minutes, prestation_id } = req.query;
    
    res.json({ disponibilites: [] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer les intervenants disponibles pour une date spécifique
app.get('/api/intervenants-disponibles-par-date', async (req, res) => {
  try {
    const { prestataire_id, date, duree_minutes, categorie } = req.query;
    
    if (!prestataire_id || !date) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const duree = parseInt(duree_minutes) || 0;
    const selectedDate = new Date(date);
    const jourSemaine = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // 1. Vérifier si le salon est ouvert ce jour
    const horaireQuery = `
      SELECT hs.is_ferme
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;
    
    db.query(horaireQuery, [prestataire_id, jourSemaine], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0 || results[0].is_ferme) {
        return res.json({ intervenants: [] });
      }

      // 2. Récupérer tous les intervenants du prestataire
      const intervenantsQuery = `
        (SELECT id_prestataire as id, prenom, nom, categorie, 'prestataire' as type, disponibilite
         FROM prestataire 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL))
        UNION
        (SELECT id_employe as id, prenom, nom, categorie, 'employe' as type, disponibilite
         FROM employe 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL) AND supprime = 0)
      `;

      db.query(intervenantsQuery, [prestataire_id, prestataire_id], async (error, intervenants) => {
        if (error) {
          return res.status(500).json({ error: 'Erreur base de données' });
        }

        // 3. Filtrer par catégorie si spécifiée
        let intervenantsFiltres = intervenants;
        if (categorie) {
          intervenantsFiltres = intervenants.filter(intervenant => 
            intervenant.categorie && intervenant.categorie.toLowerCase().includes(categorie.toLowerCase())
          );
        }

        // 4. Vérifier la disponibilité de chaque intervenant pour cette date
        const intervenantsDisponibles = [];
        
        for (const intervenant of intervenantsFiltres) {
          const estDisponible = await verifierDisponibiliteIntervenant(
            intervenant, 
            jourSemaine, 
            date, 
            duree, 
            prestataire_id
          );
          
          if (estDisponible) {
            intervenantsDisponibles.push(intervenant);
          }
        }

        res.json({ intervenants: intervenantsDisponibles });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour vérifier la disponibilité d'un intervenant
async function verifierDisponibiliteIntervenant(intervenant, jourSemaine, date, duree, prestataire_id) {
  return new Promise((resolve) => {
    // 1. Vérifier les disponibilités personnelles de l'intervenant
    let estDisponiblePersonnel = true;
    
    if (intervenant.disponibilite) {
      try {
        const rawDisponibilites = JSON.parse(intervenant.disponibilite);
        const disponibilitesConverties = convertirFormatDisponibilites(rawDisponibilites);
        
        const dispoJour = disponibilitesConverties[jourSemaine];
        estDisponiblePersonnel = dispoJour && dispoJour.debut && dispoJour.fin;
      } catch (error) {
        estDisponiblePersonnel = true;
      }
    }

    if (!estDisponiblePersonnel) {
      return resolve(false);
    }

    // 2. Vérifier les réservations existantes
    let reservationsQuery = `
      SELECT COUNT(*) as count
      FROM reservation r
      WHERE r.date_reservation = ? 
        AND r.statut = 'reservé'
        AND r.annulee = 0
        AND r.supprimee = 0
    `;
    
    let params = [date];

    if (intervenant.type === 'prestataire') {
      reservationsQuery += ` AND r.id_prestataire = ?`;
      params.push(intervenant.id);
    } else {
      reservationsQuery += ` AND r.id_employe = ?`;
      params.push(intervenant.id);
    }

    db.query(reservationsQuery, params, (error, results) => {
      if (error) {
        return resolve(false);
      }

      const hasReservations = results[0].count > 0;
      const estDisponible = !hasReservations;
      resolve(estDisponible);
    });
  });
}

// NOUVELLE API : Intervenants disponibles intelligents
app.get('/api/intervenants-disponibles-intelligents', async (req, res) => {
  try {
    const { prestataire_id, date, duree_minutes, categorie, mode = 'mixte' } = req.query;

    if (!prestataire_id) {
      return res.status(400).json({ error: 'ID prestataire requis' });
    }

    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    const dateDemandee = date ? new Date(date) : aujourdhui;
    dateDemandee.setHours(0, 0, 0, 0);
    
    const estDateAujourdhui = dateDemandee.getTime() === aujourdhui.getTime();
    const estDateFutur = dateDemandee > aujourdhui;
    const jourSemaine = dateDemandee.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // MODE 1 : Date FUTURE spécifique → vérifier disponibilités
    if (estDateFutur && !estDateAujourdhui && mode !== 'tous') {
      const queryParams = new URLSearchParams({
        prestataire_id,
        date: dateDemandee.toISOString().split('T')[0],
        ...(duree_minutes && { duree_minutes }),
        ...(categorie && { categorie })
      });

      const intervenantsDisponibles = await new Promise((resolve) => {
        db.query(
          `SELECT 
            intervenants.*,
            CASE 
              WHEN disponibilites.jour_semaine = ? THEN 'disponible'
              ELSE 'a_verifier'
            END as disponibilite_jour
          FROM (
            (SELECT id_prestataire as id, prenom, nom, categorie, 'prestataire' as type, disponibilite
             FROM prestataire WHERE id_prestataire = ?)
            UNION
            (SELECT id_employe as id, prenom, nom, categorie, 'employe' as type, disponibilite
             FROM employe WHERE id_prestataire = ? AND supprime = 0)
          ) intervenants
          LEFT JOIN (
            SELECT 'prestataire' as type, disponibilite 
            FROM prestataire WHERE id_prestataire = ?
          ) p ON intervenants.type = p.type`,
          [jourSemaine, prestataire_id, prestataire_id, prestataire_id],
          (error, results) => {
            if (error) {
              resolve([]);
            } else {
              resolve(results);
            }
          }
        );
      });

      return res.json({ 
        intervenants: intervenantsDisponibles,
        mode: 'futur',
        date_demandee: dateDemandee.toISOString().split('T')[0],
        jour_semaine: jourSemaine
      });
    }

    // MODE 2 : Date AJOURD'HUI ou MODE "TOUS" → montrer tous les intervenants
    const tousIntervenants = await new Promise((resolve) => {
      const query = `
        (SELECT id_prestataire as id, prenom, nom, categorie, 'prestataire' as type, disponibilite
         FROM prestataire 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL))
        UNION
        (SELECT id_employe as id, prenom, nom, categorie, 'employe' as type, disponibilite
         FROM employe 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL) AND supprime = 0)
        ORDER BY type, prenom, nom
      `;
      
      db.query(query, [prestataire_id, prestataire_id], (error, results) => {
        if (error) {
          resolve([]);
        } else {
          resolve(results);
        }
      });
    });

    if (tousIntervenants.length === 0) {
      return res.json({ 
        intervenants: [],
        mode: 'tous',
        message: 'Aucun intervenant trouvé'
      });
    }

    // MODE 3 : Mixte - Tous les intervenants + indication disponibilité aujourd'hui
    if (mode === 'mixte') {
      const intervenantsAvecDispo = await Promise.all(
        tousIntervenants.map(async (intervenant) => {
          try {
            const disponibilitesResponse = await new Promise((resolve) => {
              let query = '';
              let params = [];
              
              if (intervenant.type === 'prestataire') {
                query = 'SELECT disponibilite FROM prestataire WHERE id_prestataire = ?';
                params = [prestataire_id];
              } else {
                query = 'SELECT disponibilite FROM employe WHERE id_employe = ? AND id_prestataire = ?';
                params = [intervenant.id, prestataire_id];
              }
              
              db.query(query, params, (error, results) => {
                if (error) {
                  resolve({ disponibilites: {} });
                } else {
                  const disponibiliteStr = results[0]?.disponibilite || '{}';
                  try {
                    resolve({ 
                      disponibilites: JSON.parse(disponibiliteStr) || {} 
                    });
                  } catch {
                    resolve({ disponibilites: {} });
                  }
                }
              });
            });
            
            const disponibilites = disponibilitesResponse.disponibilites || {};
            const dispoAujourdhui = disponibilites[jourSemaine];
            
            let estDisponibleAujourdhui = false;
            
            if (dispoAujourdhui && dispoAujourdhui.debut && dispoAujourdhui.fin) {
              const horaireSalonResponse = await new Promise((resolve) => {
                const query = `
                  SELECT hs.heure_ouverture, hs.heure_fermeture, hs.is_ferme
                  FROM entreprise e
                  JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
                  WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
                `;
                
                db.query(query, [prestataire_id, jourSemaine], (error, results) => {
                  if (error || results.length === 0) {
                    resolve({ is_ferme: true });
                  } else {
                    resolve(results[0]);
                  }
                });
              });
              
              if (!horaireSalonResponse.is_ferme) {
                const ouvertureSalon = timeToMinutes(horaireSalonResponse.heure_ouverture);
                const fermetureSalon = timeToMinutes(horaireSalonResponse.heure_fermeture);
                const debutIntervenant = timeToMinutes(dispoAujourdhui.debut);
                const finIntervenant = timeToMinutes(dispoAujourdhui.fin);
                
                const ouvertureEffective = Math.max(ouvertureSalon, debutIntervenant);
                const fermetureEffective = Math.min(fermetureSalon, finIntervenant);
                
                estDisponibleAujourdhui = ouvertureEffective < fermetureEffective;
              }
            }
            
            return {
              ...intervenant,
              disponibilites: disponibilites,
              est_disponible_aujourdhui: estDisponibleAujourdhui,
              dispo_aujourdhui: dispoAujourdhui,
              statut_disponibilite: estDisponibleAujourdhui ? 'disponible' : 'indisponible'
            };
            
          } catch (error) {
            return {
              ...intervenant,
              disponibilites: {},
              est_disponible_aujourdhui: false,
              statut_disponibilite: 'erreur'
            };
          }
        })
      );
      
      return res.json({ 
        intervenants: intervenantsAvecDispo,
        mode: 'mixte',
        date_demandee: dateDemandee.toISOString().split('T')[0],
        jour_semaine: jourSemaine,
        est_aujourdhui: estDateAujourdhui,
        stats: {
          total: intervenantsAvecDispo.length,
          disponibles_aujourdhui: intervenantsAvecDispo.filter(i => i.est_disponible_aujourdhui).length,
          indisponibles_aujourdhui: intervenantsAvecDispo.filter(i => !i.est_disponible_aujourdhui).length
        }
      });
    }

    // MODE 4 : Simple - Juste tous les intervenants
    return res.json({ 
      intervenants: tousIntervenants,
      mode: 'tous',
      message: 'Tous les intervenants récupérés'
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// Nouvel endpoint pour vérifier la disponibilité GLOBALE (au moins un intervenant disponible)
app.get('/api/verifier-disponibilite-globale', async (req, res) => {
  try {
    const { prestataire_id, date, duree_minutes, categorie } = req.query;
    
    if (!prestataire_id || !date) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const duree = parseInt(duree_minutes) || 0;
    const selectedDate = new Date(date);
    const jourSemaine = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // 1. Vérifier si l'entreprise est fermée ce jour-là
    const horaireQuery = `
      SELECT hs.jour_semaine, hs.heure_ouverture, hs.heure_fermeture, hs.is_ferme
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;
    
    db.query(horaireQuery, [prestataire_id, jourSemaine], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0 || results[0].is_ferme) {
        return res.json({ 
          status: 'ferme',
          message: 'Entreprise fermée ce jour'
        });
      }

      const horaire = results[0];

      // 2. Récupérer tous les intervenants du prestataire
      const intervenantsQuery = `
        (SELECT id_prestataire as id, prenom, nom, categorie, 'prestataire' as type, disponibilite
         FROM prestataire 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL))
        UNION
        (SELECT id_employe as id, prenom, nom, categorie, 'employe' as type, disponibilite
         FROM employe 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL) AND supprime = 0)
      `;

      db.query(intervenantsQuery, [prestataire_id, prestataire_id], async (error, intervenants) => {
        if (error) {
          return res.status(500).json({ error: 'Erreur base de données' });
        }

        // 3. Filtrer par catégorie si spécifiée
        let intervenantsFiltres = intervenants;
        if (categorie) {
          intervenantsFiltres = intervenants.filter(intervenant => 
            intervenant.categorie && intervenant.categorie.toLowerCase().includes(categorie.toLowerCase())
          );
        }

        // 4. Vérifier si AU MOINS UN intervenant a des créneaux disponibles
        let auMoinsUnDisponible = false;
        let intervenantDisponible = null;

        for (const intervenant of intervenantsFiltres) {
          const estDisponible = await verifierCreneauxDisponiblesIntervenant(
            intervenant, horaire, date, duree, prestataire_id
          );
          
          if (estDisponible) {
            auMoinsUnDisponible = true;
            intervenantDisponible = intervenant;
            break;
          }
        }

        if (auMoinsUnDisponible) {
          return res.json({ 
            status: 'disponible',
            message: `Au moins un intervenant disponible (${intervenantsFiltres.length} au total)`,
            intervenants_total: intervenantsFiltres.length,
            intervenants_disponibles: 1
          });
        } else {
          return res.json({ 
            status: 'indisponible',
            message: 'Aucun intervenant disponible pour cette date',
            intervenants_total: intervenantsFiltres.length,
            intervenants_disponibles: 0
          });
        }
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour vérifier les créneaux disponibles d'un intervenant spécifique
async function verifierCreneauxDisponiblesIntervenant(intervenant, horaire, date, duree, prestataire_id) {
  return new Promise((resolve) => {
    const jourSemaine = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // 1. Vérifier les disponibilités personnelles
    let estDisponiblePersonnel = true;
    
    if (intervenant.disponibilite) {
      try {
        const rawDisponibilites = JSON.parse(intervenant.disponibilite);
        const disponibilitesConverties = convertirFormatDisponibilites(rawDisponibilites);
        
        const dispoJour = disponibilitesConverties[jourSemaine];
        estDisponiblePersonnel = dispoJour && dispoJour.debut && dispoJour.fin;
        
      } catch (error) {
        estDisponiblePersonnel = true;
      }
    }

    if (!estDisponiblePersonnel) {
      return resolve(false);
    }

    // 2. Vérifier les créneaux disponibles
    let reservationsQuery = `
      SELECT r.heure_debut, r.heure_fin 
      FROM reservation r
      WHERE r.date_reservation = ? 
        AND r.statut = 'reservé'
        AND r.annulee = 0
        AND r.supprimee = 0
    `;
    
    let params = [date];

    if (intervenant.type === 'prestataire') {
      reservationsQuery += ` AND r.id_prestataire = ?`;
      params.push(intervenant.id);
    } else {
      reservationsQuery += ` AND r.id_employe = ?`;
      params.push(intervenant.id);
    }

    db.query(reservationsQuery, params, (error, reservations) => {
      if (error) {
        return resolve(false);
      }

      // 3. Vérifier s'il reste au moins un créneau disponible
      const hasCreneauDisponible = verifierCreneauxDisponiblesIntervenantCalcul(horaire, reservations, duree);
      
      resolve(hasCreneauDisponible);
    });
  });
}

// Fonction de calcul pour vérifier les créneaux disponibles
function verifierCreneauxDisponiblesIntervenantCalcul(horaire, reservations, dureeMinutes) {
  const ouvertureMin = timeToMinutes(horaire.heure_ouverture);
  const fermetureMin = timeToMinutes(horaire.heure_fermeture);

  const plagesOccupees = reservations.map(res => ({
    debut: timeToMinutes(res.heure_debut),
    fin: timeToMinutes(res.heure_fin)
  }));

  for (let time = ouvertureMin; time <= fermetureMin - dureeMinutes; time += dureeMinutes) {
    const creneauFin = time + dureeMinutes;
    
    if (creneauFin > fermetureMin) continue;
    
    const estOccupe = plagesOccupees.some(occupe => 
      time < occupe.fin && creneauFin > occupe.debut
    );

    if (!estOccupe) {
      return true;
    }
  }

  return false;
}

// Endpoint pour récupérer toutes les disponibilités (tous les intervenants) AVEC INTERSECTION
app.get('/api/disponibilites-globales', async (req, res) => {
  try {
    const { prestataire_id, date, duree_minutes, categorie } = req.query;
    
    if (!prestataire_id || !date) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const duree = parseInt(duree_minutes) || 0;
    const selectedDate = new Date(date);
    const jourSemaine = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // 1. Récupérer les horaires du salon
    const horaireQuery = `
      SELECT hs.jour_semaine, hs.heure_ouverture, hs.heure_fermeture, 
             hsp.heure_debut as pause_debut, hsp.heure_fin as pause_fin,
             hs.is_ferme
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      LEFT JOIN horaires_salon_pause hsp ON hs.id = hsp.salon_id AND hs.jour_semaine = hsp.jour_semaine
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;
    
    db.query(horaireQuery, [prestataire_id, jourSemaine], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0 || results[0].is_ferme) {
        return res.json({ disponibilites: [] });
      }

      const horaireSalon = results[0];

      // 2. Récupérer tous les intervenants
      const intervenantsQuery = `
        (SELECT id_prestataire as id, prenom, nom, categorie, 'prestataire' as type, disponibilite
         FROM prestataire 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL))
        UNION
        (SELECT id_employe as id, prenom, nom, categorie, 'employe' as type, disponibilite
         FROM employe 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL) AND supprime = 0)
      `;

      db.query(intervenantsQuery, [prestataire_id, prestataire_id], async (error, intervenants) => {
        if (error) {
          return res.status(500).json({ error: 'Erreur base de données' });
        }

        // 3. Filtrer par catégorie si spécifiée
        let intervenantsFiltres = intervenants;
        if (categorie) {
          intervenantsFiltres = intervenants.filter(intervenant => 
            intervenant.categorie && intervenant.categorie.toLowerCase().includes(categorie.toLowerCase())
          );
        }

        // 4. Récupérer les disponibilités de chaque intervenant AVEC INTERSECTION
        const toutesDisponibilites = [];

        for (const intervenant of intervenantsFiltres) {
          const disponibilites = await getDisponibilitesIntervenantAvecIntersection(
            intervenant, horaireSalon, date, duree, prestataire_id
          );
          
          disponibilites.forEach(creneau => {
            creneau.intervenant_id = intervenant.id;
            creneau.intervenant_prenom = intervenant.prenom;
            creneau.intervenant_nom = intervenant.nom;
            creneau.intervenant_type = intervenant.type;
          });
          
          toutesDisponibilites.push(...disponibilites);
        }

        // 5. Trier les créneaux par heure
        toutesDisponibilites.sort((a, b) => a.decimal - b.decimal);

        res.json({ 
          disponibilites: toutesDisponibilites,
          resume: {
            intervenants_total: intervenantsFiltres.length,
            creneaux_total: toutesDisponibilites.length,
            horaire_salon: `${horaireSalon.heure_ouverture}-${horaireSalon.heure_fermeture}`
          }
        });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour récupérer les disponibilités d'un intervenant spécifique AVEC INTERSECTION
async function getDisponibilitesIntervenantAvecIntersection(intervenant, horaireSalon, date, duree, prestataire_id) {
  return new Promise((resolve) => {
    const jourSemaine = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // 1. Récupérer les disponibilités personnelles
    let disponibilitesPersonnelles = null;
    if (intervenant.disponibilite) {
      try {
        const rawDisponibilites = JSON.parse(intervenant.disponibilite);
        disponibilitesPersonnelles = convertirFormatDisponibilites(rawDisponibilites);
      } catch (error) {
      }
    }

    const dispoJour = disponibilitesPersonnelles ? disponibilitesPersonnelles[jourSemaine] : null;
    const estDisponiblePersonnel = !dispoJour || (dispoJour && dispoJour.debut && dispoJour.fin);

    if (!estDisponiblePersonnel) {
      return resolve([]);
    }

    // 2. Récupérer les réservations de cet intervenant
    let reservationsQuery = `
      SELECT r.heure_debut, r.heure_fin 
      FROM reservation r
      WHERE r.date_reservation = ? 
        AND r.statut = 'reservé'
        AND r.supprimee = 0
        AND r.annulee = 0
    `;
    
    let params = [date];

    if (intervenant.type === 'prestataire') {
      reservationsQuery += ` AND r.id_prestataire = ?`;
      params.push(intervenant.id);
    } else {
      reservationsQuery += ` AND r.id_employe = ?`;
      params.push(intervenant.id);
    }

    db.query(reservationsQuery, params, (error, reservations) => {
      if (error) {
        return resolve([]);
      }

      // 3. Calculer les créneaux disponibles AVEC INTERSECTION
      const disponibilitesIntervenant = dispoJour && dispoJour.debut ? {
        debut: dispoJour.debut,
        fin: dispoJour.fin
      } : null;

      const disponibilites = calculerCreneauxAvecDureeExacte(
        horaireSalon, 
        reservations, 
        duree, 
        disponibilitesIntervenant
      );
      
      resolve(disponibilites);
    });
  });
}

// Nouvel endpoint pour vérifier si un intervenant a des créneaux disponibles (mode intervenant-first)
app.get('/api/verifier-disponibilite-intervenant-complet', async (req, res) => {
  try {
    const { prestataire_id, employe_id, date, duree_minutes } = req.query;
    
    if (!prestataire_id || !date || !duree_minutes) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const duree = parseInt(duree_minutes);
    const selectedDate = new Date(date);
    const jourSemaine = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // 1. Récupérer les horaires du salon
    const horairesQuery = `
      SELECT hs.jour_semaine, hs.heure_ouverture, hs.heure_fermeture, 
             hsp.heure_debut as pause_debut, hsp.heure_fin as pause_fin,
             hs.is_ferme
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      LEFT JOIN horaires_salon_pause hsp ON hs.id = hsp.salon_id AND hs.jour_semaine = hsp.jour_semaine
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;

    db.query(horairesQuery, [prestataire_id, jourSemaine], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0 || results[0].is_ferme) {
        return res.json({ 
          status: 'ferme',
          message: 'Salon fermé ce jour'
        });
      }

      const horaire = results[0];

      // 2. Vérifier la disponibilité personnelle de l'intervenant
      const checkDisponibiliteIntervenant = () => {
        return new Promise((resolve, reject) => {
          let query = '';
          let params = [];

          if (employe_id === "prestataire") {
            query = 'SELECT disponibilite FROM prestataire WHERE id_prestataire = ?';
            params = [prestataire_id];
          } else {
            query = 'SELECT disponibilite FROM employe WHERE id_employe = ? AND id_prestataire = ?';
            params = [employe_id, prestataire_id];
          }

          db.query(query, params, (error, results) => {
            if (error) {
              return reject(error);
            }

            if (results.length === 0) {
              return resolve(false);
            }

            const disponibiliteStr = results[0].disponibilite;
            
            if (!disponibiliteStr) {
              return resolve(true);
            }

            try {
              const rawDisponibilites = JSON.parse(disponibiliteStr);
              const disponibilitesConverties = convertirFormatDisponibilites(rawDisponibilites);
              
              const dispoJour = disponibilitesConverties[jourSemaine];
              const estDisponible = dispoJour && dispoJour.debut && dispoJour.fin;
              
              resolve(estDisponible);
              
            } catch (parseError) {
              resolve(true);
            }
          });
        });
      };

      // 3. Vérifier la disponibilité de l'intervenant
      checkDisponibiliteIntervenant().then(estDisponiblePersonnel => {
        if (!estDisponiblePersonnel) {
          return res.json({ 
            status: 'indisponible_intervenant',
            message: 'Intervenant non disponible ce jour'
          });
        }

        // 4. Récupérer les réservations de cet intervenant
        let reservationsQuery = `
          SELECT r.heure_debut, r.heure_fin 
          FROM reservation r
          WHERE r.date_reservation = ? 
          AND r.statut = 'reservé'
          AND r.supprimee = 0
          AND r.annulee = 0
        `;
        
        let params = [date];

        if (employe_id === "prestataire") {
          reservationsQuery += ` AND r.id_prestataire = ?`;
          params.push(prestataire_id);
        } else {
          reservationsQuery += ` AND r.id_employe = ?`;
          params.push(employe_id);
        }

        db.query(reservationsQuery, params, (error, reservations) => {
          if (error) {
            return res.status(500).json({ error: 'Erreur reservations' });
          }

          // 5. CALCUL DES CRÉNEAUX DISPONIBLES - VÉRIFICATION COMPLÈTE
          const creneauxDisponibles = calculerCreneauxAvecDureeExacte(horaire, reservations, duree);

          // CORRECTION ICI : "indisponible" = AUCUN créneau disponible
          if (creneauxDisponibles.length === 0) {
            return res.json({ 
              status: 'indisponible',
              message: 'Aucun créneau disponible pour cet intervenant'
            });
          } else {
            return res.json({ 
              status: 'disponible',
              message: `${creneauxDisponibles.length} créneau(x) disponible(s)`,
              creneaux_count: creneauxDisponibles.length
            });
          }
        });

      }).catch(error => {
        res.status(500).json({ error: 'Erreur vérification disponibilité' });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Nouvel endpoint pour récupérer les intervenants disponibles avec intersection horaires
app.get('/api/intervenants-disponibles-par-date-avec-intersection', async (req, res) => {
  try {
    const { prestataire_id, date, duree_minutes, categorie } = req.query;
    
    if (!prestataire_id || !date) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const duree = parseInt(duree_minutes) || 0;
    const selectedDate = new Date(date);
    const jourSemaine = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // 1. Récupérer les horaires du salon
    const horaireQuery = `
      SELECT hs.jour_semaine, hs.heure_ouverture, hs.heure_fermeture, hs.is_ferme
      FROM entreprise e
      JOIN horaires_salon hs ON e.id_entreprise = hs.id_entreprise
      WHERE e.id_prestataire = ? AND hs.jour_semaine = ?
    `;
    
    db.query(horaireQuery, [prestataire_id, jourSemaine], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0 || results[0].is_ferme) {
        return res.json({ intervenants: [] });
      }

      const horaireSalon = results[0];

      // 2. Récupérer tous les intervenants du prestataire
      const intervenantsQuery = `
        (SELECT id_prestataire as id, prenom, nom, categorie, 'prestataire' as type, disponibilite
         FROM prestataire 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL))
        UNION
        (SELECT id_employe as id, prenom, nom, categorie, 'employe' as type, disponibilite
         FROM employe 
         WHERE id_prestataire = ? AND (conge = 0 OR conge IS NULL) AND supprime = 0)
      `;

      db.query(intervenantsQuery, [prestataire_id, prestataire_id], async (error, intervenants) => {
        if (error) {
          return res.status(500).json({ error: 'Erreur base de données' });
        }

        // 3. Filtrer par catégorie si spécifiée
        let intervenantsFiltres = intervenants;
        if (categorie) {
          intervenantsFiltres = intervenants.filter(intervenant => 
            intervenant.categorie && intervenant.categorie.toLowerCase().includes(categorie.toLowerCase())
          );
        }

        // 4. Vérifier la disponibilité de chaque intervenant avec intersection horaires
        const intervenantsDisponibles = [];
        
        for (const intervenant of intervenantsFiltres) {
          const estDisponible = await verifierDisponibiliteIntervenantAvecIntersection(
            intervenant, 
            horaireSalon,
            jourSemaine, 
            date, 
            duree, 
            prestataire_id
          );
          
          if (estDisponible) {
            intervenantsDisponibles.push(intervenant);
          }
        }

        res.json({ intervenants: intervenantsDisponibles });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour vérifier la disponibilité d'un intervenant avec intersection horaires
async function verifierDisponibiliteIntervenantAvecIntersection(intervenant, horaireSalon, jourSemaine, date, duree, prestataire_id) {
  return new Promise((resolve) => {
    // 1. Vérifier les disponibilités personnelles
    let disponibilitesPersonnelles = null;
    if (intervenant.disponibilite) {
      try {
        const rawDisponibilites = JSON.parse(intervenant.disponibilite);
        disponibilitesPersonnelles = convertirFormatDisponibilites(rawDisponibilites);
      } catch (error) {
        // Erreur silencieuse
      }
    }

    const dispoJour = disponibilitesPersonnelles ? disponibilitesPersonnelles[jourSemaine] : null;
    
    // Vérifier si l'intervenant est explicitement non disponible
    if (dispoJour === null) {
      return resolve(false);
    }

    // 2. Vérifier l'intersection des horaires
    const horairesIntervenant = dispoJour && dispoJour.debut ? {
      debut: dispoJour.debut,
      fin: dispoJour.fin
    } : null;

    // Si l'intervenant a des horaires personnels, vérifier l'intersection
    if (horairesIntervenant) {
      const ouvertureSalonMin = timeToMinutes(horaireSalon.heure_ouverture);
      const fermetureSalonMin = timeToMinutes(horaireSalon.heure_fermeture);
      const ouvertureIntervenantMin = timeToMinutes(horairesIntervenant.debut);
      const fermetureIntervenantMin = timeToMinutes(horairesIntervenant.fin);
      
      const ouvertureEffective = Math.max(ouvertureSalonMin, ouvertureIntervenantMin);
      const fermetureEffective = Math.min(fermetureSalonMin, fermetureIntervenantMin);
      
      if (ouvertureEffective >= fermetureEffective) {
        return resolve(false);
      }
    }

    // 3. Vérifier les réservations existantes
    let reservationsQuery = `
      SELECT COUNT(*) as count
      FROM reservation r
      WHERE r.date_reservation = ? 
        AND r.statut = 'reservé'
        AND r.annulee = 0
        AND r.supprimee = 0
    `;
    
    let params = [date];

    if (intervenant.type === 'prestataire') {
      reservationsQuery += ` AND r.id_prestataire = ?`;
      params.push(intervenant.id);
    } else {
      reservationsQuery += ` AND r.id_employe = ?`;
      params.push(intervenant.id);
    }

    db.query(reservationsQuery, params, (error, results) => {
      if (error) {
        return resolve(false);
      }

      // Pour l'instant, on considère disponible s'il n'a pas de réservation
      // Une vérification plus poussée serait nécessaire pour les créneaux spécifiques
      const estDisponible = results[0].count === 0;
      
      resolve(estDisponible);
    });
  });
}

// Endpoint pour récupérer les réservations d'un jour spécifique
app.get('/api/reservations-du-jour', (req, res) => {
  try {
    const { date, prestataire_id } = req.query;
    
    if (!date || !prestataire_id) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const query = `
      SELECT 
        r.id_reservation,
        TIME_FORMAT(r.heure_debut, '%H:%i') as heure_debut,
        TIME_FORMAT(r.heure_fin, '%H:%i') as heure_fin,
        r.statut,
        r.mode_paiement,
        r.commentaire,
        p.titre as prestation_titre,
        p.prix as prestation_prix,
        p.temps as prestation_temps,
        c.prenom as client_prenom,
        c.nom as client_nom,
        c.mail as client_mail,
        c.numero as client_telephone,
        COALESCE(e.prenom, pr.prenom) as intervenant_prenom,
        COALESCE(e.nom, pr.nom) as intervenant_nom,
        CASE 
          WHEN r.id_employe IS NOT NULL THEN 'employe'
          ELSE 'prestataire'
        END as type_intervenant
      FROM reservation r
      JOIN prestation p ON r.id_prestation = p.id_prestation
      JOIN client c ON r.id_client = c.id_client
      LEFT JOIN employe e ON r.id_employe = e.id_employe
      LEFT JOIN prestataire pr ON r.id_prestataire = pr.id_prestataire
      WHERE r.date_reservation = ?
        AND (r.id_prestataire = ? OR e.id_prestataire = ?)
        AND r.supprimee = 0
        AND r.annulee = 0
      ORDER BY r.heure_debut ASC
    `;

    db.query(query, [date, prestataire_id, prestataire_id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }
      
      res.json({ 
        reservations: results,
        count: results.length
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour modifier une réservation
app.put('/api/reservations/:id', async (req, res) => {
  try {
    const reservationId = req.params.id;
    const {
      heure_debut,
      heure_fin,
      statut,
      commentaire,
      client_prenom,
      client_nom,
      client_telephone,
      client_mail
    } = req.body;

    // 1. Récupérer la réservation existante pour avoir l'ID client
    const getReservationQuery = 'SELECT id_client FROM reservation WHERE id_reservation = ?';
    
    db.query(getReservationQuery, [reservationId], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Réservation non trouvée' });
      }

      const id_client = results[0].id_client;

      // 2. Mettre à jour le client
      const updateClientQuery = `
        UPDATE client 
        SET prenom = ?, nom = ?, numero = ?, mail = ?
        WHERE id_client = ?
      `;

      db.query(updateClientQuery, [
        client_prenom,
        client_nom,
        client_telephone || null,
        client_mail || null,
        id_client
      ], (error) => {
        if (error) {
          return res.status(500).json({ error: 'Erreur mise à jour client' });
        }

        // 3. Mettre à jour la réservation
        const updateReservationQuery = `
          UPDATE reservation 
          SET heure_debut = ?, heure_fin = ?, statut = ?, commentaire = ?, updated_at = NOW()
          WHERE id_reservation = ?
        `;

        db.query(updateReservationQuery, [
          heure_debut,
          heure_fin,
          statut,
          commentaire || null,
          reservationId
        ], (error) => {
          if (error) {
            return res.status(500).json({ error: 'Erreur mise à jour réservation' });
          }

          res.json({ 
            success: true,
            message: 'Réservation modifiée avec succès'
          });
        });
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour annuler une réservation
app.put('/api/reservations/:id/annuler', async (req, res) => {
  try {
    const reservationId = req.params.id;

    const query = `
      UPDATE reservation 
      SET statut = 'annulé', annuler = 1, updated_at = NOW()
      WHERE id_reservation = ?
    `;

    db.query(query, [reservationId], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Réservation non trouvée' });
      }

      res.json({ 
        success: true,
        message: 'Réservation annulée avec succès'
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Page mes RDV
// Page mes RDV
app.get('/api/rendez-vous-client/:id', (req, res) => {
  const clientId = req.params.id;
  
  const query = `
    SELECT 
      r.id_reservation as id,
      r.date_reservation as date,
      r.heure_debut,
      r.heure_fin,
      r.statut,
      r.commentaire,
      r.annulee,  -- ← AJOUTER CE CHAMP
      p.titre as prestation_titre,
      p.prix as prestation_prix,
      p.temps as prestation_temps,
      pr.nom as prestataire_nom,
      pr.prenom as prestataire_prenom,
      e.nom as employe_nom,
      e.prenom as employe_prenom,
      ent.nom as entreprise_nom
    FROM reservation r
    LEFT JOIN prestation p ON r.id_prestation = p.id_prestation
    LEFT JOIN prestataire pr ON r.id_prestataire = pr.id_prestataire
    LEFT JOIN employe e ON r.id_employe = e.id_employe
    LEFT JOIN entreprise ent ON pr.id_prestataire = ent.id_prestataire
    WHERE r.id_client = ?
    ORDER BY r.date_reservation DESC, r.heure_debut DESC
  `;

  db.query(query, [clientId], (error, results) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur base de données',
        error: error.message
      });
    }

    // Transformer les résultats
    const transformedResults = results.map(row => ({
      id: row.id,
      date: row.date,
      heureDebut: row.heure_debut,
      heureFin: row.heure_fin,
      statut: row.statut,
      annulee: row.annulee === 1, // ← Convertir en boolean
      commentaire: row.commentaire,
      prestation: {
        titre: row.prestation_titre,
        prix: row.prestation_prix,
        temps: row.prestation_temps
      },
      prestataire: row.prestataire_nom ? {
        nom: row.prestataire_nom,
        prenom: row.prestataire_prenom
      } : null,
      employe: row.employe_nom ? {
        nom: row.employe_nom,
        prenom: row.employe_prenom
      } : null,
      entreprise: row.entreprise_nom ? {
        nom: row.entreprise_nom
      } : null
    }));


    res.json({
      success: true,
      data: transformedResults,
      count: transformedResults.length
    });
  });
});



app.put('/api/rendez-vous/:reservationId/annuler', (req, res) => {
  const { reservationId } = req.params;

  if (!reservationId || isNaN(reservationId)) {
    return res.status(400).json({
      success: false,
      message: 'ID réservation invalide'
    });
  }

  const checkQuery = `
    SELECT annulee, date_reservation, heure_debut 
    FROM reservation 
    WHERE id_reservation = ? AND supprimee = 0
  `;

  db.query(checkQuery, [reservationId], (checkError, checkResults) => {
    if (checkError) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification'
      });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    const reservation = checkResults[0];

    // Vérifier si déjà annulée (annulee = 1)
    if (reservation.annulee === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation est déjà annulée'
      });
    }

    // Vérifier si la date n'est pas passée (optionnel)
    const maintenant = new Date();
    const dateReservation = new Date(reservation.date_reservation + ' ' + reservation.heure_debut);
    
    if (dateReservation < maintenant) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une réservation passée'
      });
    }

    const updateQuery = `
      UPDATE reservation 
      SET annulee = 1, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id_reservation = ?
    `;

    db.query(updateQuery, [reservationId], (updateError, updateResults) => {
      if (updateError) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'annulation'
        });
      }

-
      res.json({
        success: true,
        message: 'Réservation annulée avec succès'
      });
    });
  });
});




// page confirmation 
app.get('/api/prestations-confirmation', (req, res) => {
  const { id_prestataire, prestation_id } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ error: 'ID prestataire requis' });
  }

  let query = '';
  let params = [];

  // Si un ID de prestation spécifique est demandé
  if (prestation_id) {
    query = `
      SELECT 
        id_prestation, 
        titre, 
        prix, 
        categorie,
        temps,
        description
      FROM prestation 
      WHERE id_prestation = ? 
      AND id_prestataire = ?
      AND supprime = 0
    `;
    params = [prestation_id, id_prestataire];
  } else {
    // Si on veut toutes les prestations du prestataire
    query = `
      SELECT 
        id_prestation, 
        titre, 
        prix, 
        categorie,
        temps,
        description
      FROM prestation 
      WHERE id_prestataire = ? 
      AND supprime = 0
      ORDER BY categorie, titre
    `;
    params = [id_prestataire];
  }

  db.query(query, params, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de base de données' });
    }

    if (prestation_id && results.length === 0) {
      return res.status(404).json({ error: 'Prestation non trouvée' });
    }

    res.json({
      prestations: results,
      count: results.length
    });
  });
});

// NOUVEL ENDPOINT POUR LES DISPONIBILITÉS DES EMPLOYÉS
app.get('/api/disponibilites-employe-calendrier', (req, res) => {
  const { employe_id, prestataire_id } = req.query;

  if (!employe_id || !prestataire_id) {
    return res.status(400).json({ error: 'ID employé et prestataire requis' });
  }

  const query = `
    SELECT disponibilite 
    FROM employe 
    WHERE id_employe = ? 
    AND id_prestataire = ?
    AND supprime = 0
  `;

  db.query(query, [employe_id, prestataire_id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de base de données' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employe = results[0];

    let disponibilites = {};
    
    try {
      // Essayer de parser les disponibilités si c'est une string JSON
      if (employe.disponibilite && typeof employe.disponibilite === 'string') {
        disponibilites = JSON.parse(employe.disponibilite);
      } else if (employe.disponibilite && typeof employe.disponibilite === 'object') {
        disponibilites = employe.disponibilite;
      }
    } catch (parseError) {
      // Erreur silencieuse
    }
    
    res.json({
      disponibilites: disponibilites,
      employe_id: employe_id,
      prestataire_id: prestataire_id
    });
  });
});

// MODIFICATION DE L'ENDPOINT EXISTANT POUR GÉRER LES DEUX CAS
app.get('/api/disponibilites-intervenant-calendrier', (req, res) => {
  const { prestataire_id, employe_id } = req.query;

  if (!prestataire_id) {
    return res.status(400).json({ error: 'ID prestataire requis' });
  }

  // Si c'est le prestataire lui-même
  if (!employe_id || employe_id === 'prestataire') {
    // Récupérer les disponibilités du prestataire
    const query = `
      SELECT disponibilite 
      FROM prestataire 
      WHERE id_prestataire = ?
    `;

    db.query(query, [prestataire_id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Prestataire non trouvé' });
      }

      const prestataire = results[0];

      let disponibilites = {};
      
      try {
        // Essayer de parser les disponibilités si c'est une string JSON
        if (prestataire.disponibilite && typeof prestataire.disponibilite === 'string') {
          disponibilites = JSON.parse(prestataire.disponibilite);
        } else if (prestataire.disponibilite && typeof prestataire.disponibilite === 'object') {
          disponibilites = prestataire.disponibilite;
        }
      } catch (parseError) {
        // Erreur silencieuse
      }
      
      res.json({
        disponibilites: disponibilites,
        type: 'prestataire'
      });
    });
  } else {
    // Si c'est un employé
    // Récupérer les disponibilités de l'employé
    const query = `
      SELECT disponibilite 
      FROM employe 
      WHERE id_employe = ? 
      AND id_prestataire = ?
      AND supprime = 0
    `;

    db.query(query, [employe_id, prestataire_id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Employé non trouvé' });
      }

      const employe = results[0];

      let disponibilites = {};
      
      try {
        // Essayer de parser les disponibilités si c'est une string JSON
        if (employe.disponibilite && typeof employe.disponibilite === 'string') {
          disponibilites = JSON.parse(employe.disponibilite);
        } else if (employe.disponibilite && typeof employe.disponibilite === 'object') {
          disponibilites = employe.disponibilite;
        }
      } catch (parseError) {
        // Erreur silencieuse
      }
      
      res.json({
        disponibilites: disponibilites,
        type: 'employe'
      });
    });
  }
});

// Route pour récupérer les catégories les plus populaires
app.get('/api/categories/top', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT categorie as nom, COUNT(*) as count 
      FROM prestations 
      GROUP BY categorie 
      ORDER BY count DESC 
      LIMIT 4
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// page dashboard //
// Route pour le dashboard
app.get('/api/dashboard/:prestataire_id', async (req, res) => {
  try {
    const { prestataire_id } = req.params;
    const { periode } = req.query;

    if (!prestataire_id) {
      return res.status(400).json({ error: 'ID prestataire requis' });
    }

    // Récupérer les statistiques financières
    const statsQuery = `
      SELECT 
        -- CA du jour
        COALESCE(SUM(CASE WHEN DATE(r.date_reservation) = CURDATE() THEN p.prix ELSE 0 END), 0) as ca_jour,
        
        -- Taux d'occupation
        COUNT(CASE WHEN DATE(r.date_reservation) = CURDATE() AND r.statut = 'reservé' THEN 1 END) as reservations_jour,
        
        -- Nouveaux clients
        COUNT(DISTINCT CASE WHEN DATE(c.created_at) = CURDATE() THEN c.id_client END) as nouveaux_clients,
        
        -- CA mensuel
        COALESCE(SUM(CASE WHEN MONTH(r.date_reservation) = MONTH(CURDATE()) THEN p.prix ELSE 0 END), 0) as ca_mensuel,
        
        -- CA annuel
        COALESCE(SUM(CASE WHEN YEAR(r.date_reservation) = YEAR(CURDATE()) THEN p.prix ELSE 0 END), 0) as ca_annuel,
        
        -- Remboursements et annulations
        COUNT(CASE WHEN r.statut = 'annulé' AND MONTH(r.date_reservation) = MONTH(CURDATE()) THEN 1 END) as reservations_annulees,
        COALESCE(SUM(CASE WHEN r.statut = 'annulé' AND MONTH(r.date_reservation) = MONTH(CURDATE()) THEN p.prix ELSE 0 END), 0) as montant_remboursements,
        
        -- Total réservations
        COUNT(CASE WHEN MONTH(r.date_reservation) = MONTH(CURDATE()) THEN 1 END) as reservations_total
        
      FROM reservation r
      JOIN prestation p ON r.id_prestation = p.id_prestation
      LEFT JOIN client c ON r.id_client = c.id_client
      WHERE (r.id_prestataire = ? OR r.id_employe IN (
        SELECT id_employe FROM employe WHERE id_prestataire = ?
      ))
      AND r.supprimee = 0
    `;

    db.query(statsQuery, [prestataire_id, prestataire_id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      const stats = results[0];
      
      // Calcul du taux d'occupation (simplifié)
      const tauxOccupation = stats.reservations_jour > 0 ? 
        Math.min((stats.reservations_jour / 8) * 100, 100).toFixed(0) : 0;

      const responseStats = {
        caJour: stats.ca_jour,
        tauxOccupation: tauxOccupation,
        nouveauxClients: stats.nouveaux_clients,
        caMensuel: stats.ca_mensuel,
        caAnnuel: stats.ca_annuel,
        reservationsAnnulees: stats.reservations_annulees,
        montantRemboursements: stats.montant_remboursements,
        reservationsTotal: stats.reservations_total
      };

      res.json({
        stats: responseStats,
        charts: {}
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


app.get('/api/dashboard-stats/:prestataire_id', async (req, res) => {
  try {
    const { prestataire_id } = req.params;
    const { periode = 'semaine' } = req.query;

    if (!prestataire_id || isNaN(prestataire_id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID prestataire valide requis' 
      });
    }

    const reservationsQuery = `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN DATE(r.date_reservation) = CURDATE() 
          AND r.statut = 'reservé' 
          AND r.annulee = 0 
          THEN p.prix ELSE 0 
        END), 0) as ca_jour,
        
        COUNT(CASE 
          WHEN DATE(r.date_reservation) = CURDATE() 
          AND r.statut = 'reservé' 
          AND r.annulee = 0 
          THEN 1 END) as reservations_jour,
        
        COUNT(DISTINCT CASE 
          WHEN MONTH(r.date_reservation) = MONTH(CURDATE()) 
          AND YEAR(r.date_reservation) = YEAR(CURDATE())
          AND r.statut = 'reservé'
          AND r.annulee = 0
          AND r.id_client IS NOT NULL
          AND r.id_client NOT IN (
            SELECT DISTINCT id_client 
            FROM reservation r2 
            WHERE (r2.id_prestataire = ? OR r2.id_employe IN (
              SELECT id_employe FROM employe WHERE id_prestataire = ?
            ))
            AND r2.date_reservation < DATE_FORMAT(NOW(), '%Y-%m-01')
            AND r2.statut = 'reservé'
            AND r2.annulee = 0
            AND r2.id_client IS NOT NULL
          )
          THEN r.id_client END) as nouveaux_clients,
        
        COALESCE(SUM(CASE 
          WHEN MONTH(r.date_reservation) = MONTH(CURDATE()) 
          AND YEAR(r.date_reservation) = YEAR(CURDATE())
          AND r.statut = 'reservé'
          AND r.annulee = 0
          THEN p.prix ELSE 0 
        END), 0) as ca_mensuel,
        
        COALESCE(SUM(CASE 
          WHEN YEAR(r.date_reservation) = YEAR(CURDATE())
          AND r.statut = 'reservé'
          AND r.annulee = 0
          THEN p.prix ELSE 0 
        END), 0) as ca_annuel,
        
        COUNT(CASE 
          WHEN MONTH(r.date_reservation) = MONTH(CURDATE()) 
          AND YEAR(r.date_reservation) = YEAR(CURDATE())
          AND (r.statut = 'annulé' OR r.annulee = 1)
          THEN 1 END) as reservations_annulees,
        
        COALESCE(SUM(CASE 
          WHEN MONTH(r.date_reservation) = MONTH(CURDATE()) 
          AND YEAR(r.date_reservation) = YEAR(CURDATE())
          AND (r.statut = 'annulé' OR r.annulee = 1)
          THEN p.prix ELSE 0 
        END), 0) as montant_remboursements,
        
        COUNT(CASE 
          WHEN MONTH(r.date_reservation) = MONTH(CURDATE()) 
          AND YEAR(r.date_reservation) = YEAR(CURDATE())
          THEN 1 END) as reservations_total
        
      FROM reservation r
      JOIN prestation p ON r.id_prestation = p.id_prestation
      WHERE (r.id_prestataire = ? OR r.id_employe IN (
        SELECT id_employe FROM employe WHERE id_prestataire = ?
      ))
      AND r.supprimee = 0
    `;

    db.query(reservationsQuery, [
      prestataire_id, prestataire_id,
      prestataire_id, prestataire_id
    ], (error, results) => {
      if (error) {
        return res.status(500).json({ 
          success: false,
          error: 'Erreur base de données réservations',
          details: error.message 
        });
      }

      const reservationsStats = results[0] || {};
      
      const tauxOccupation = reservationsStats.reservations_jour > 0 ? 
        Math.min((reservationsStats.reservations_jour / 10) * 100, 100) : 0;

      const produitsQuery = `
        SELECT 
          COUNT(*) as produits_vendus,
          COALESCE(SUM(pr.prix * pa.quantite), 0) as ca_produits
        FROM panier pa
        JOIN produit pr ON pa.id_produit = pr.id_produit
        JOIN commande c ON pa.id_panier = c.id_commande
        WHERE pr.id_prestataire = ?
        AND c.etat = 'terminée'
        AND MONTH(c.date_commande) = MONTH(CURDATE())
        AND YEAR(c.date_commande) = YEAR(CURDATE())
      `;

      db.query(produitsQuery, [prestataire_id], (produitsError, produitsResults) => {
        const produitsStats = produitsError ? { produits_vendus: 0, ca_produits: 0 } : (produitsResults[0] || {});

        const responseStats = {
          caJour: Math.round(reservationsStats.ca_jour || 0),
          tauxOccupation: Math.round(tauxOccupation),
          nouveauxClients: reservationsStats.nouveaux_clients || 0,
          caMensuel: Math.round(reservationsStats.ca_mensuel || 0),
          caAnnuel: Math.round(reservationsStats.ca_annuel || 0),
          reservationsAnnulees: reservationsStats.reservations_annulees || 0,
          montantRemboursements: Math.round(reservationsStats.montant_remboursements || 0),
          reservationsTotal: reservationsStats.reservations_total || 0,
          produitsVendus: produitsStats.produits_vendus || 0,
          caProduits: Math.round(produitsStats.ca_produits || 0)
        };

        const getChartData = () => {
          return {
            caHebdo: {
              labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
              datasets: [{ 
                data: [320, 450, 280, 510, 490, 620, 380],
                color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`
              }]
            },
            reservationsMensuelles: {
              labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
              datasets: [{ 
                data: [45, 52, 48, 60, 55, 65],
                color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`
              }]
            },
            repartitionPrestations: [
              { name: 'Coiffeur', population: 45, color: '#FF6384', legendFontColor: '#7F7F7F' },
              { name: 'Ongles', population: 25, color: '#36A2EB', legendFontColor: '#7F7F7F' },
              { name: 'Soins', population: 20, color: '#FFCE56', legendFontColor: '#7F7F7F' },
              { name: 'Autre', population: 10, color: '#4BC0C0', legendFontColor: '#7F7F7F' }
            ]
          };
        };

        res.json({
          success: true,
          stats: responseStats,
          charts: getChartData(),
          periode: periode,
          lastUpdate: new Date().toISOString()
        });
      });
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors du chargement du dashboard',
      details: error.message 
    });
  }
});

// API pour récupérer les prestations groupées par catégorie
app.get('/api/prestations-par-categorie', (req, res) => {
  const { id_prestataire } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID prestataire requis' 
    });
  }

  const query = `
    SELECT 
      categorie,
      COUNT(*) as nombre_prestations,
      GROUP_CONCAT(titre SEPARATOR '|||') as titres_prestations,
      SUM(prix) as total_prix,
      AVG(prix) as prix_moyen
    FROM prestation 
    WHERE id_prestataire = ? 
      AND supprime = 0
      AND categorie IS NOT NULL
      AND categorie != ''
    GROUP BY categorie
    ORDER BY nombre_prestations DESC
  `;

  db.query(query, [id_prestataire], (error, results) => {
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur base de données' 
      });
    }

    const categoriesData = results.map((row, index) => {
      const colors = {
        'Coiffeur': '#FF6384',
        'Coiffure': '#FF6384',
        'Ongles': '#36A2EB',
        'Soins': '#FFCE56',
        'Soin': '#FFCE56',
        'Beauté': '#9966FF',
        'Massage': '#FF9F40',
        'Esthétique': '#4BC0C0',
        'Barbier': '#FF9F40',
        'Maquillage': '#C9CBCF',
        'Épilation': '#FF6384'
      };

      const titres = row.titres_prestations ? row.titres_prestations.split('|||') : [];

      return {
        categorie: row.categorie,
        count: row.nombre_prestations,
        color: colors[row.categorie] || getRandomColor(index),
        total_prix: parseFloat(row.total_prix || 0),
        prix_moyen: parseFloat(row.prix_moyen || 0),
        titres_prestations: titres
      };
    });

    res.json({
      success: true,
      categories: categoriesData,
      total_prestations: categoriesData.reduce((sum, cat) => sum + cat.count, 0),
      total_categories: categoriesData.length
    });
  });
});

function getRandomColor(index) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
    '#FF9F40', '#C9CBCF', '#FF6384', '#36A2EB', '#FFCE56'
  ];
  return colors[index % colors.length];
}

app.get('/api/prestations-completes', (req, res) => {
  const { id_prestataire } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ error: 'ID prestataire requis' });
  }

  const query = `
    SELECT 
      id_prestation,
      titre,
      prix,
      categorie,
      temps,
      description
    FROM prestation 
    WHERE id_prestataire = ? 
      AND supprime = 0
    ORDER BY categorie, titre
  `;

  db.query(query, [id_prestataire], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur base de données' });
    }

    const prestationsParCategorie = {};
    results.forEach(prestation => {
      const categorie = prestation.categorie || 'Autre';
      if (!prestationsParCategorie[categorie]) {
        prestationsParCategorie[categorie] = [];
      }
      prestationsParCategorie[categorie].push(prestation);
    });

    res.json({
      success: true,
      prestations: results,
      par_categorie: prestationsParCategorie,
      total: results.length
    });
  });
});

app.get('/api/prestations-reservees-par-categorie', (req, res) => {
  const { id_prestataire } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID prestataire requis' 
    });
  }

  const query = `
    SELECT 
      p.categorie,
      COUNT(*) as nombre_reservations,
      SUM(p.prix) as chiffre_affaires,
      AVG(p.prix) as prix_moyen,
      GROUP_CONCAT(DISTINCT p.titre SEPARATOR '|||') as prestations_reservees
    FROM reservation r
    JOIN prestation p ON r.id_prestation = p.id_prestation
    WHERE (r.id_prestataire = ? OR r.id_employe IN (
      SELECT id_employe FROM employe WHERE id_prestataire = ?
    ))
    AND r.statut = 'reservé'
    AND r.annulee = 0
    AND r.supprimee = 0
    AND p.categorie IS NOT NULL
    AND p.categorie != ''
    AND r.date_reservation >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    GROUP BY p.categorie
    ORDER BY nombre_reservations DESC
  `;

  db.query(query, [id_prestataire, id_prestataire], (error, results) => {
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur base de données' 
      });
    }

    const totalReservations = results.reduce((sum, row) => sum + row.nombre_reservations, 0);
    const totalCA = results.reduce((sum, row) => sum + parseFloat(row.chiffre_affaires || 0), 0);

    const categoriesData = results.map((row, index) => {
      const colors = {
        'Coiffeur': '#FF6384',
        'Coiffure': '#FF6384',
        'Ongles': '#36A2EB',
        'Soins': '#FFCE56',
        'Soin': '#FFCE56',
        'Beauté': '#9966FF',
        'Massage': '#FF9F40',
        'Esthétique': '#4BC0C0',
        'Barbier': '#FF9F40',
        'Maquillage': '#C9CBCF',
        'Épilation': '#FF6384'
      };

      const prestations = row.prestations_reservees ? row.prestations_reservees.split('|||') : [];
      
      const pourcentageReservations = totalReservations > 0 ? 
        ((row.nombre_reservations / totalReservations) * 100).toFixed(1) : 0;
      
      const pourcentageCA = totalCA > 0 ? 
        ((parseFloat(row.chiffre_affaires) / totalCA) * 100).toFixed(1) : 0;

      return {
        categorie: row.categorie,
        count: row.nombre_reservations,
        color: colors[row.categorie] || getRandomColor(index),
        chiffre_affaires: parseFloat(row.chiffre_affaires || 0),
        prix_moyen: parseFloat(row.prix_moyen || 0),
        prestations_reservees: prestations,
        pourcentage_reservations: parseFloat(pourcentageReservations),
        pourcentage_ca: parseFloat(pourcentageCA)
      };
    });

    res.json({
      success: true,
      categories: categoriesData,
      total_reservations: totalReservations,
      total_chiffre_affaires: totalCA,
      total_categories: categoriesData.length,
      periode: '1 mois'
    });
  });
});

app.get('/api/prestations-reservees-toutes', (req, res) => {
  const { id_prestataire, periode = '1 mois' } = req.query;

  if (!id_prestataire) {
    return res.status(400).json({ error: 'ID prestataire requis' });
  }

  let dateFiltre = '';
  switch(periode) {
    case '1 semaine':
      dateFiltre = 'AND r.date_reservation >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
      break;
    case '1 mois':
      dateFiltre = 'AND r.date_reservation >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
      break;
    case '3 mois':
      dateFiltre = 'AND r.date_reservation >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
      break;
    case '1 an':
      dateFiltre = 'AND r.date_reservation >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
      break;
    default:
      dateFiltre = 'AND r.date_reservation >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
  }

  const query = `
    SELECT 
      p.categorie,
      COUNT(*) as nombre_reservations,
      SUM(p.prix) as chiffre_affaires,
      AVG(p.prix) as prix_moyen,
      MIN(r.date_reservation) as premiere_reservation,
      MAX(r.date_reservation) as derniere_reservation
    FROM reservation r
    JOIN prestation p ON r.id_prestation = p.id_prestation
    WHERE (r.id_prestataire = ? OR r.id_employe IN (
      SELECT id_employe FROM employe WHERE id_prestataire = ?
    ))
    AND r.statut = 'reservé'
    AND r.annulee = 0
    AND r.supprimee = 0
    AND p.categorie IS NOT NULL
    ${dateFiltre}
    GROUP BY p.categorie
    ORDER BY nombre_reservations DESC
  `;

  db.query(query, [id_prestataire, id_prestataire], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur base de données' });
    }

    const totalReservations = results.reduce((sum, row) => sum + row.nombre_reservations, 0);
    const totalCA = results.reduce((sum, row) => sum + parseFloat(row.chiffre_affaires || 0), 0);

    const categoriesData = results.map((row, index) => {
      const pourcentageReservations = totalReservations > 0 ? 
        ((row.nombre_reservations / totalReservations) * 100).toFixed(1) : 0;
      
      const pourcentageCA = totalCA > 0 ? 
        ((parseFloat(row.chiffre_affaires) / totalCA) * 100).toFixed(1) : 0;

      return {
        categorie: row.categorie,
        count: row.nombre_reservations,
        color: getRandomColor(index),
        chiffre_affaires: parseFloat(row.chiffre_affaires || 0),
        prix_moyen: parseFloat(row.prix_moyen || 0),
        pourcentage_reservations: parseFloat(pourcentageReservations),
        pourcentage_ca: parseFloat(pourcentageCA),
        periode: {
          premiere: row.premiere_reservation,
          derniere: row.derniere_reservation
        }
      };
    });

    res.json({
      success: true,
      categories: categoriesData,
      total_reservations: totalReservations,
      total_chiffre_affaires: totalCA,
      total_categories: categoriesData.length,
      periode: periode
    });
  });
});

// page ClientsManagement
app.get('/api/v2/clients/list', (req, res) => {
  const { prestataire_id, page = 1, limit = 15, search = '' } = req.query;

  if (!prestataire_id) {
    return res.status(400).json({ success: false, error: 'ID prestataire requis' });
  }

  const offset = (page - 1) * limit;

  let baseQuery = `
    SELECT 
      c.id_client as id,
      c.prenom,
      c.nom,
      c.mail,
      c.numero as telephone,
      c.genre,
      c.date_naissance,
      c.adresse,
      c.ville,
      c.code_postal,
      COUNT(r.id_reservation) as total_rdv,
      MAX(r.date_reservation) as derniere_visite,
      MIN(r.date_reservation) as premiere_visite,
      COALESCE(SUM(p.prix), 0) as total_depense,
      COUNT(DISTINCT p.categorie) as categories_utilisees
    FROM client c
    INNER JOIN reservation r ON c.id_client = r.id_client 
      AND r.supprimee = 0
      AND r.annulee = 0
      AND (r.id_prestataire = ? OR r.id_employe IN (SELECT id_employe FROM employe WHERE id_prestataire = ?))
    LEFT JOIN prestation p ON r.id_prestation = p.id_prestation
    WHERE 1=1
  `;

  let countQuery = `
    SELECT COUNT(DISTINCT c.id_client) as total
    FROM client c
    INNER JOIN reservation r ON c.id_client = r.id_client 
      AND r.supprimee = 0
      AND r.annulee = 0
      AND (r.id_prestataire = ? OR r.id_employe IN (SELECT id_employe FROM employe WHERE id_prestataire = ?))
    WHERE 1=1
  `;

  let queryParams = [prestataire_id, prestataire_id];
  let countParams = [prestataire_id, prestataire_id];

  if (search && search.trim() !== '') {
    const searchFilter = ` AND (c.prenom LIKE ? OR c.nom LIKE ? OR c.mail LIKE ? OR c.numero LIKE ?)`;
    const searchTerm = `%${search.trim()}%`;
    
    baseQuery += searchFilter;
    countQuery += searchFilter;
    
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  baseQuery += `
    GROUP BY c.id_client, c.prenom, c.nom, c.mail, c.numero, c.genre, 
             c.date_naissance, c.adresse, c.ville, c.code_postal
    ORDER BY derniere_visite DESC, c.nom ASC, c.prenom ASC
    LIMIT ? OFFSET ?
  `;

  queryParams.push(parseInt(limit), offset);

  db.query(countQuery, countParams, (countError, countResults) => {
    if (countError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors du comptage des clients',
        details: countError.message 
      });
    }

    const total = countResults[0]?.total || 0;

    db.query(baseQuery, queryParams, (error, results) => {
      if (error) {
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur base de données',
          details: error.message
        });
      }

      const clientsFormates = results.map(client => ({
        id: client.id,
        prenom: client.prenom,
        nom: client.nom,
        mail: client.mail,
        telephone: client.telephone,
        genre: client.genre,
        date_naissance: client.date_naissance,
        age: client.date_naissance ? calculerAge(client.date_naissance) : null,
        adresse: client.adresse,
        ville: client.ville,
        code_postal: client.code_postal,
        statistiques: {
          total_rdv: client.total_rdv || 0,
          total_depense: parseFloat(client.total_depense || 0),
          categories_utilisees: client.categories_utilisees || 0,
          derniere_visite: client.derniere_visite,
          premiere_visite: client.premiere_visite
        }
      }));

      res.json({
        success: true,
        data: {
          clients: clientsFormates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
    });
  });
});

app.get('/api/v2/clients/:client_id/details', (req, res) => {
  const { client_id } = req.params;
  const { prestataire_id } = req.query;

  if (!client_id || !prestataire_id) {
    return res.status(400).json({ success: false, error: 'ID client et prestataire requis' });
  }

  const clientQuery = `
    SELECT 
      c.*,
      COUNT(r.id_reservation) as total_reservations,
      MAX(r.date_reservation) as derniere_visite,
      MIN(r.date_reservation) as premiere_visite,
      COALESCE(SUM(p.prix), 0) as chiffre_affaires_total
    FROM client c
    INNER JOIN reservation r ON c.id_client = r.id_client 
      AND r.supprimee = 0
      AND r.annulee = 0
      AND (r.id_prestataire = ? OR r.id_employe IN (SELECT id_employe FROM employe WHERE id_prestataire = ?))
    LEFT JOIN prestation p ON r.id_prestation = p.id_prestation
    WHERE c.id_client = ?
    GROUP BY c.id_client
  `;

  db.query(clientQuery, [prestataire_id, prestataire_id, client_id], (error, results) => {
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur base de données',
        details: error.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Client non trouvé ou aucune réservation pour ce prestataire' 
      });
    }

    const clientData = results[0];

    const historiqueQuery = `
      SELECT 
        r.id_reservation as id,
        r.date_reservation as date,
        TIME_FORMAT(r.heure_debut, '%H:%i') as heure_debut,
        TIME_FORMAT(r.heure_fin, '%H:%i') as heure_fin,
        r.statut,
        r.commentaire,
        p.titre as prestation_nom,
        p.prix,
        p.categorie,
        COALESCE(e.prenom, pr.prenom) as intervenant_prenom,
        COALESCE(e.nom, pr.nom) as intervenant_nom
      FROM reservation r
      JOIN prestation p ON r.id_prestation = p.id_prestation
      LEFT JOIN employe e ON r.id_employe = e.id_employe
      LEFT JOIN prestataire pr ON r.id_prestataire = pr.id_prestataire
      WHERE r.id_client = ?
        AND (r.id_prestataire = ? OR e.id_prestataire = ?)
        AND r.supprimee = 0
      ORDER BY r.date_reservation DESC
      LIMIT 10
    `;

    db.query(historiqueQuery, [client_id, prestataire_id, prestataire_id], (histError, historique) => {
      if (histError) {
        historique = [];
      }

      const statsQuery = `
        SELECT 
          p.categorie,
          COUNT(*) as nombre_rdv,
          COALESCE(SUM(p.prix), 0) as montant_total
        FROM reservation r
        JOIN prestation p ON r.id_prestation = p.id_prestation
        WHERE r.id_client = ?
          AND (r.id_prestataire = ? OR r.id_employe IN (SELECT id_employe FROM employe WHERE id_prestataire = ?))
          AND r.supprimee = 0
          AND r.annulee = 0
        GROUP BY p.categorie
        ORDER BY nombre_rdv DESC
      `;

      db.query(statsQuery, [client_id, prestataire_id, prestataire_id], (statsError, stats) => {
        if (statsError) {
          stats = [];
        }

        const response = {
          success: true,
          data: {
            informations: {
              id: clientData.id_client,
              prenom: clientData.prenom,
              nom: clientData.nom,
              mail: clientData.mail,
              telephone: clientData.numero,
              genre: clientData.genre,
              date_naissance: clientData.date_naissance,
              age: clientData.date_naissance ? calculerAge(clientData.date_naissance) : null,
              adresse: clientData.adresse,
              ville: clientData.ville,
              code_postal: clientData.code_postal
            },
            statistiques_globales: {
              total_rdv: clientData.total_reservations || 0,
              chiffre_affaires: parseFloat(clientData.chiffre_affaires_total || 0),
              derniere_visite: clientData.derniere_visite,
              premiere_visite: clientData.premiere_visite
            },
            preferences: stats.map(stat => ({
              categorie: stat.categorie,
              pourcentage: clientData.total_reservations > 0 
                ? Math.round((stat.nombre_rdv / clientData.total_reservations) * 100) 
                : 0,
              nombre_rdv: stat.nombre_rdv,
              montant_total: parseFloat(stat.montant_total || 0)
            })),
            historique: historique.map(rdv => ({
              id: rdv.id,
              date: rdv.date,
              heure_debut: rdv.heure_debut,
              heure_fin: rdv.heure_fin,
              statut: rdv.statut,
              prestation: {
                nom: rdv.prestation_nom,
                prix: parseFloat(rdv.prix),
                categorie: rdv.categorie
              },
              intervenant: {
                prenom: rdv.intervenant_prenom,
                nom: rdv.intervenant_nom
              },
              commentaire: rdv.commentaire
            }))
          }
        };

        res.json(response);
      });
    });
  });
});

function calculerAge(dateNaissance) {
  if (!dateNaissance) return null;
  
  try {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    
    if (isNaN(birthDate.getTime())) {
      return null;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
}

app.get('/api/v2/factures/reservation/:reservation_id', (req, res) => {
  const { reservation_id } = req.params;
  const { prestataire_id } = req.query;

  if (!reservation_id || !prestataire_id) {
    return res.status(400).json({ success: false, error: 'ID réservation et prestataire requis' });
  }

  const factureQuery = `
    SELECT 
      r.id_reservation,
      r.date_reservation,
      TIME_FORMAT(r.heure_debut, '%H:%i') as heure_debut,
      TIME_FORMAT(r.heure_fin, '%H:%i') as heure_fin,
      p.titre as prestation_nom,
      p.prix,
      p.description as prestation_description,
      c.id_client,
      c.prenom as client_prenom,
      c.nom as client_nom,
      c.mail as client_email,
      c.numero as client_telephone,
      c.adresse as client_adresse,
      c.ville as client_ville,
      c.code_postal as client_code_postal,
      entreprise.nom as entreprise_nom,
      entreprise.adresse as entreprise_adresse,
      entreprise.ville as entreprise_ville,
      entreprise.code_postal as entreprise_code_postal,
      entreprise.numero as entreprise_telephone,
      pr.prenom as prestataire_prenom,
      pr.nom as prestataire_nom,
      COALESCE(e.prenom, pr.prenom) as intervenant_prenom,
      COALESCE(e.nom, pr.nom) as intervenant_nom
    FROM reservation r
    JOIN prestation p ON r.id_prestation = p.id_prestation
    JOIN client c ON r.id_client = c.id_client
    JOIN prestataire pr ON (r.id_prestataire = pr.id_prestataire OR r.id_employe IN (SELECT id_employe FROM employe WHERE id_prestataire = pr.id_prestataire))
    LEFT JOIN entreprise ON pr.id_prestataire = entreprise.id_prestataire
    LEFT JOIN employe e ON r.id_employe = e.id_employe
    WHERE r.id_reservation = ?
      AND (r.id_prestataire = ? OR e.id_prestataire = ?)
      AND r.supprimee = 0
    LIMIT 1
  `;

  db.query(factureQuery, [reservation_id, prestataire_id, prestataire_id], (error, results) => {
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur base de données',
        details: error.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    const factureData = results[0];
    
    const numeroFacture = `FAC-${new Date().getFullYear()}-${reservation_id.toString().padStart(6, '0')}`;
    const dateEmission = new Date().toISOString().split('T')[0];
    const tvaPourcentage = 20;
    const montantHT = parseFloat(factureData.prix);
    const montantTVA = (montantHT * tvaPourcentage) / 100;
    const montantTTC = montantHT + montantTVA;

    const facture = {
      success: true,
      data: {
        facture: {
          numero: numeroFacture,
          date_emission: dateEmission,
          date_prestation: factureData.date_reservation,
          heure_prestation: factureData.heure_debut
        },
        client: {
          nom: `${factureData.client_prenom} ${factureData.client_nom}`,
          email: factureData.client_email,
          telephone: factureData.client_telephone,
          adresse: factureData.client_adresse,
          ville: factureData.client_ville,
          code_postal: factureData.client_code_postal
        },
        prestataire: {
          entreprise: factureData.entreprise_nom || `${factureData.prestataire_prenom} ${factureData.prestataire_nom}`,
          adresse: factureData.entreprise_adresse || 'Non renseignée',
          ville: factureData.entreprise_ville || 'Non renseignée',
          code_postal: factureData.entreprise_code_postal || 'Non renseigné',
          telephone: factureData.entreprise_telephone || 'Non renseigné'
        },
        prestation: {
          nom: factureData.prestation_nom,
          description: factureData.prestation_description || 'Aucune description',
          intervenant: `${factureData.intervenant_prenom} ${factureData.intervenant_nom}`
        },
        montants: {
          ht: montantHT.toFixed(2),
          tva_pourcentage: tvaPourcentage,
          tva: montantTVA.toFixed(2),
          ttc: montantTTC.toFixed(2)
        }
      }
    };

    res.json(facture);
  });
});


// 🔹 Route pour générer une facture multiple
app.post('/api/v2/factures/multiple', (req, res) => {
  const { reservation_ids, prestataire_id } = req.body;

  if (!reservation_ids || !Array.isArray(reservation_ids) || reservation_ids.length === 0 || !prestataire_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Liste de réservations et ID prestataire requis' 
    });
  }

  // Convertir le tableau en chaîne pour la requête SQL
  const idsString = reservation_ids.join(',');
  
  const factureMultipleQuery = `
    SELECT 
      r.id_reservation,
      r.date_reservation,
      TIME_FORMAT(r.heure_debut, '%H:%i') as heure_debut,
      TIME_FORMAT(r.heure_fin, '%H:%i') as heure_fin,
      p.titre as prestation_nom,
      p.prix,
      p.description as prestation_description,
      c.id_client,
      c.prenom as client_prenom,
      c.nom as client_nom,
      c.mail as client_email,
      c.numero as client_telephone,
      c.adresse as client_adresse,
      c.ville as client_ville,
      c.code_postal as client_code_postal,
      entreprise.nom as entreprise_nom,
      entreprise.adresse as entreprise_adresse,
      entreprise.ville as entreprise_ville,
      entreprise.code_postal as entreprise_code_postal,
      entreprise.numero as entreprise_telephone,
      pr.prenom as prestataire_prenom,
      pr.nom as prestataire_nom,
      COALESCE(e.prenom, pr.prenom) as intervenant_prenom,
      COALESCE(e.nom, pr.nom) as intervenant_nom
    FROM reservation r
    JOIN prestation p ON r.id_prestation = p.id_prestation
    JOIN client c ON r.id_client = c.id_client
    JOIN prestataire pr ON (r.id_prestataire = pr.id_prestataire OR r.id_employe IN (SELECT id_employe FROM employe WHERE id_prestataire = pr.id_prestataire))
    LEFT JOIN entreprise ON pr.id_prestataire = entreprise.id_prestataire
    LEFT JOIN employe e ON r.id_employe = e.id_employe
    WHERE r.id_reservation IN (${idsString})
      AND (r.id_prestataire = ? OR e.id_prestataire = ?)
      AND r.supprimee = 0
    ORDER BY r.date_reservation
  `;

  db.query(factureMultipleQuery, [prestataire_id, prestataire_id], (error, results) => {
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur base de données',
        details: error.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'Aucune réservation trouvée' });
    }

    // Vérifier que toutes les réservations sont pour le même client
    const clientIds = [...new Set(results.map(r => r.id_client))];
    if (clientIds.length > 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les réservations doivent être pour le même client' 
      });
    }

    const firstResult = results[0];
    
    // Générer un numéro de facture unique
    const numeroFacture = `FAC-MULTI-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const dateEmission = new Date().toISOString().split('T')[0];
    
    // Calculer les totaux
    let totalHT = 0;
    const tvaPourcentage = 20;
    
    const prestations = results.map(reservation => {
      const prixHT = parseFloat(reservation.prix);
      totalHT += prixHT;
      
      return {
        id_reservation: reservation.id_reservation,
        date: reservation.date_reservation,
        heure: reservation.heure_debut,
        nom: reservation.prestation_nom,
        description: reservation.prestation_description || 'Aucune description',
        intervenant: `${reservation.intervenant_prenom} ${reservation.intervenant_nom}`,
        prix_ht: prixHT.toFixed(2)
      };
    });

    const montantTVA = (totalHT * tvaPourcentage) / 100;
    const montantTTC = totalHT + montantTVA;

    const factureMultiple = {
      success: true,
      data: {
        facture: {
          numero: numeroFacture,
          date_emission: dateEmission,
          nombre_prestations: results.length
        },
        client: {
          nom: `${firstResult.client_prenom} ${firstResult.client_nom}`,
          email: firstResult.client_email,
          telephone: firstResult.client_telephone,
          adresse: firstResult.client_adresse,
          ville: firstResult.client_ville,
          code_postal: firstResult.client_code_postal
        },
        prestataire: {
          entreprise: firstResult.entreprise_nom || `${firstResult.prestataire_prenom} ${firstResult.prestataire_nom}`,
          adresse: firstResult.entreprise_adresse || 'Non renseignée',
          ville: firstResult.entreprise_ville || 'Non renseignée',
          code_postal: firstResult.entreprise_code_postal || 'Non renseigné',
          telephone: firstResult.entreprise_telephone || 'Non renseigné'
        },
        prestations: prestations,
        resume: {
          total_ht: totalHT.toFixed(2),
          tva_pourcentage: tvaPourcentage,
          total_tva: montantTVA.toFixed(2),
          total_ttc: montantTTC.toFixed(2)
        }
      }
    };

    res.json(factureMultiple);
  });
});

// page details //

// API pour rechercher une prestation
app.get('/api/rechercher-prestation', (req, res) => {
  const { titre, prestataire_id } = req.query;
  
  if (!titre || !prestataire_id) {
    return res.status(400).json({ error: 'Titre et prestataire_id requis' });
  }
  
  const query = `
    SELECT id_prestation, titre, prix, temps, categorie
    FROM prestation 
    WHERE titre LIKE ? 
    AND id_prestataire = ?
    AND supprime = 0
    LIMIT 5
  `;
  
  db.query(query, [`%${titre}%`, prestataire_id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur base de données' });
    }
    
    res.json({
      success: true,
      prestations: results,
      count: results.length
    });
  });
});

// MISE À JOUR DE L'API SERVER POUR ÊTRE PLUS TOLÉRANTE
app.post('/api/reservations/modifier', async (req, res) => {
  try {
    const {
      id_reservation,
      id_prestation,
      date_reservation,
      heure_debut,
      heure_fin,
      statut = 'reservé',
      annulee = 0,
      id_client,
      id_prestataire,
      id_employe,
      commentaire = null
    } = req.body;

    if (!id_reservation) {
      return res.status(400).json({
        success: false,
        error: 'ID réservation requis'
      });
    }

    let finalDateReservation = date_reservation;
    if (!finalDateReservation && heure_debut) {
      const date = new Date();
      finalDateReservation = `${date.toISOString().split('T')[0]} ${heure_debut}:00`;
    }

    const checkQuery = 'SELECT * FROM reservation WHERE id_reservation = ?';
    db.query(checkQuery, [id_reservation], (checkError, checkResults) => {
      if (checkError) {
        return res.status(500).json({
          success: false,
          error: 'Erreur base de données'
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Réservation non trouvée'
        });
      }

      const oldReservation = checkResults[0];

      const finalIdPrestation = id_prestation || oldReservation.id_prestation;
      const finalIdPrestataire = id_prestataire || oldReservation.id_prestataire;
      const finalIdEmploye = id_employe !== undefined ? id_employe : oldReservation.id_employe;
      const finalIdClient = id_client || oldReservation.id_client;
      const finalHeureDebut = heure_debut || oldReservation.heure_debut;
      const finalHeureFin = heure_fin || oldReservation.heure_fin;

      const updateQuery = `
        UPDATE reservation 
        SET 
          id_prestation = ?,
          date_reservation = COALESCE(?, date_reservation),
          heure_debut = ?,
          heure_fin = ?,
          statut = ?,
          annulee = ?,
          id_client = ?,
          id_prestataire = ?,
          id_employe = ?,
          commentaire = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id_reservation = ?
      `;

      const updateValues = [
        finalIdPrestation,
        finalDateReservation,
        finalHeureDebut,
        finalHeureFin,
        statut,
        annulee,
        finalIdClient,
        finalIdPrestataire,
        finalIdEmploye,
        commentaire,
        id_reservation
      ];

      db.query(updateQuery, updateValues, (updateError, updateResults) => {
        if (updateError) {
          return res.status(500).json({
            success: false,
            error: 'Erreur lors de la modification',
            details: updateError.message
          });
        }

        const getUpdatedQuery = `
          SELECT r.*, 
                 p.titre as prestation_titre,
                 p.prix as prestation_prix,
                 p.temps as prestation_temps,
                 p.categorie as prestation_categorie,
                 pr.nom as prestataire_nom,
                 pr.prenom as prestataire_prenom,
                 e.nom as employe_nom,
                 e.prenom as employe_prenom
          FROM reservation r
          LEFT JOIN prestation p ON r.id_prestation = p.id_prestation
          LEFT JOIN prestataire pr ON r.id_prestataire = pr.id_prestataire
          LEFT JOIN employe e ON r.id_employe = e.id_employe
          WHERE r.id_reservation = ?
        `;

        db.query(getUpdatedQuery, [id_reservation], (getError, getResults) => {
          if (getError) {
            return res.json({
              success: true,
              message: 'Réservation modifiée avec succès',
              id_reservation: id_reservation,
              affectedRows: updateResults.affectedRows
            });
          }

          const updatedReservation = getResults[0];
          
          res.json({
            success: true,
            message: 'Réservation modifiée avec succès',
            reservation: updatedReservation,
            changes: {
              ancienne_date: oldReservation.date_reservation,
              nouvelle_date: finalDateReservation || oldReservation.date_reservation,
              ancien_heure_debut: oldReservation.heure_debut,
              nouveau_heure_debut: finalHeureDebut,
              ancien_intervenant: oldReservation.id_employe || oldReservation.id_prestataire,
              nouvel_intervenant: finalIdEmploye || finalIdPrestataire
            }
          });
        });
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// CORRECTION COMPLÈTE DE L'ENDPOINT
app.get('/api/prestation/modif', (req, res) => {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID prestation requis' 
    });
  }

  const prestationId = parseInt(id);
  if (isNaN(prestationId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID prestation invalide (doit être un nombre)' 
    });
  }

  const query = `
    SELECT 
      id_prestation, 
      titre, 
      prix, 
      categorie,
      nom_categorie,
      temps,
      description,
      id_prestataire,
      supprime
    FROM prestation 
    WHERE id_prestation = ?
  `;
  
  db.query(query, [prestationId], (error, results) => {
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur base de données',
        details: error.message 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prestation non trouvée'
      });
    }

    const prestationData = results[0];

    if (prestationData.supprime === 1) {
      return res.status(410).json({
        success: false,
        error: 'Prestation supprimée',
        prestation: prestationData
      });
    }

    const categorieFinale = prestationData.categorie || prestationData.nom_categorie || '';
    
    res.json({
      success: true,
      prestation: prestationData,
      categorie: categorieFinale,
      categorie_enum: prestationData.categorie,
      nom_categorie: prestationData.nom_categorie
    });
  });
});

// NOUVELLE API pour récupérer les intervenants par réservation
app.get('/api/intervenants-par-reservation', (req, res) => {
  const { id_reservation } = req.query;
  
  if (!id_reservation) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID réservation requis' 
    });
  }

  const reservationId = parseInt(id_reservation);
  if (isNaN(reservationId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID réservation invalide' 
    });
  }

  const getCategorieQuery = `
    SELECT 
      p.categorie,
      p.nom_categorie,
      p.id_prestation,
      p.titre
    FROM reservation r
    INNER JOIN prestation p ON r.id_prestation = p.id_prestation
    WHERE r.id_reservation = ?
  `;
  
  db.query(getCategorieQuery, [reservationId], (categorieError, categorieResults) => {
    if (categorieError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur récupération catégorie' 
      });
    }
    
    if (categorieResults.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      });
    }
    
    const prestationData = categorieResults[0];
    const categoriePrestation = prestationData.categorie || prestationData.nom_categorie || '';
    
    const getIntervenantsQuery = `
      SELECT 
        'prestataire' AS type,
        pr.id_prestataire AS id,
        pr.prenom,
        pr.nom,
        pr.categorie,
        pr.id_prestataire
      FROM reservation r
      INNER JOIN prestation p ON r.id_prestation = p.id_prestation
      INNER JOIN prestataire pr ON r.id_prestataire = pr.id_prestataire
      WHERE r.id_reservation = ?
        AND (
          pr.categorie LIKE CONCAT('%', ?, '%') 
          OR pr.categorie LIKE CONCAT('%', ?, '%')
          OR pr.categorie REGEXP ?
        )

      UNION ALL

      SELECT 
        'employe' AS type,
        e.id_employe AS id,
        e.prenom,
        e.nom,
        e.categorie,
        e.id_prestataire
      FROM reservation r
      INNER JOIN prestation p ON r.id_prestation = p.id_prestation
      INNER JOIN prestataire pr ON r.id_prestataire = pr.id_prestataire
      INNER JOIN employe e ON pr.id_prestataire = e.id_prestataire
      WHERE r.id_reservation = ?
        AND (
          e.categorie LIKE CONCAT('%', ?, '%') 
          OR e.categorie LIKE CONCAT('%', ?, '%')
          OR e.categorie REGEXP ?
        )
      
      ORDER BY type DESC, prenom, nom;
    `;
    
    const searchPattern = categoriePrestation ? 
      `(^|,|\\[|")${categoriePrestation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(,|\\]|"|$)` : '';
    
    db.query(getIntervenantsQuery, [
      reservationId, 
      categoriePrestation, categoriePrestation, searchPattern,
      reservationId, 
      categoriePrestation, categoriePrestation, searchPattern
    ], (error, results) => {
      if (error) {
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur base de données',
          details: error.message 
        });
      }
      
      res.json({
        success: true,
        reservationId: reservationId,
        intervenants: results,
        count: results.length,
        categorie_prestation: categoriePrestation,
        prestation_details: prestationData,
        categorie_enum: prestationData.categorie,
        nom_categorie: prestationData.nom_categorie
      });
    });
  });
});

// API pour récupérer les détails d'une réservation
app.get('/api/reservations/:id/details', (req, res) => {
  const reservationId = req.params.id;
  
  const query = `
    SELECT 
      r.*,
      p.id_prestation,
      p.titre,
      p.prix,
      p.temps,
      p.categorie,
      p.nom_categorie,
      p.description,
      pr.id_prestataire,
      pr.nom as prestataire_nom,
      pr.prenom as prestataire_prenom,
      e.id_employe,
      e.nom as employe_nom,
      e.prenom as employe_prenom
    FROM reservation r
    LEFT JOIN prestation p ON r.id_prestation = p.id_prestation
    LEFT JOIN prestataire pr ON r.id_prestataire = pr.id_prestataire
    LEFT JOIN employe e ON r.id_employe = e.id_employe
    WHERE r.id_reservation = ?
  `;
  
  db.query(query, [reservationId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur base de données' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    
    const reservation = results[0];
    
    const formatted = {
      id: reservation.id_reservation,
      date: reservation.date_reservation,
      heure_debut: reservation.heure_debut,
      heure_fin: reservation.heure_fin,
      statut: reservation.statut,
      annulee: reservation.annulee,
      prestation: {
        id: reservation.id_prestation,
        titre: reservation.titre,
        prix: reservation.prix,
        temps: reservation.temps,
        categorie: reservation.categorie,
        nom_categorie: reservation.nom_categorie,
        description: reservation.description
      },
      prestataire: reservation.id_prestataire ? {
        id: reservation.id_prestataire,
        nom: reservation.prestataire_nom,
        prenom: reservation.prestataire_prenom
      } : null,
      employe: reservation.id_employe ? {
        id: reservation.id_employe,
        nom: reservation.employe_nom,
        prenom: reservation.employe_prenom
      } : null
    };
    
    res.json(formatted);
  });
});

// API pour vérifier les correspondances catégorielles
app.get('/api/verifier-categories-correspondantes', async (req, res) => {
  try {
    const { prestataire_id, categorie_prestation } = req.query;
    
    const query = `
      (SELECT 
        'prestataire' as type,
        id_prestataire as id,
        prenom,
        nom,
        categorie
      FROM prestataire 
      WHERE id_prestataire = ?)
      
      UNION ALL
      
      (SELECT 
        'employe' as type,
        id_employe as id,
        prenom,
        nom,
        categorie
      FROM employe 
      WHERE id_prestataire = ? AND supprime = 0)
    `;
    
    db.query(query, [prestataire_id, prestataire_id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur base de données' });
      }
      
      const intervenantsCompatibles = results.filter(intervenant => {
        if (!intervenant.categorie) return false;
        
        try {
          let categories = intervenant.categorie;
          
          if (typeof categories === 'string' && categories.startsWith('[')) {
            categories = JSON.parse(categories);
          }
          
          if (!Array.isArray(categories)) {
            categories = [categories];
          }
          
          return categories.some(cat => 
            cat && cat.toString().trim().toLowerCase() === categorie_prestation.toLowerCase().trim()
          );
          
        } catch (e) {
          return false;
        }
      });
      
      res.json({
        categorie_recherchee: categorie_prestation,
        total_intervenants: results.length,
        intervenants_compatibles: intervenantsCompatibles.length,
        intervenants: intervenantsCompatibles
      });
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//page paiement //

// Route pour créer une nouvelle réservation
app.post('/api/reservations', async (req, res) => {
  try {
    const {
      id_prestation,
      id_client,
      id_employe,
      id_prestataire,
      date_reservation,
      heure_debut,
      heure_fin,
      mode_paiement = 'en ligne',
      statut = 'reservé',
      commentaire,
      annulee = 0,
      supprimee = 0
    } = req.body;

    if (!id_prestation || !id_client || !date_reservation || !heure_debut || !heure_fin) {
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants'
      });
    }

    const clientExists = await new Promise((resolve, reject) => {
      db.query('SELECT id_client FROM client WHERE id_client = ?', [id_client], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (!clientExists) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé'
      });
    }

    const prestationExists = await new Promise((resolve, reject) => {
      db.query('SELECT id_prestation, id_prestataire FROM prestation WHERE id_prestation = ?', [id_prestation], (error, results) => {
        if (error) reject(error);
        resolve(results[0]);
      });
    });

    if (!prestationExists) {
      return res.status(404).json({
        success: false,
        error: 'Prestation non trouvée'
      });
    }

    const conflitQuery = `
      SELECT id_reservation 
      FROM reservation 
      WHERE date_reservation = ? 
        AND heure_debut < ? 
        AND heure_fin > ? 
        AND (id_employe = ? OR id_prestataire = ?)
        AND statut = 'reservé'
        AND annulee = 0
        AND supprimee = 0
    `;

    const conflits = await new Promise((resolve, reject) => {
      db.query(conflitQuery, [
        date_reservation,
        heure_fin,
        heure_debut,
        id_employe || null,
        id_prestataire || prestationExists.id_prestataire
      ], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });

    if (conflits.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Créneau déjà réservé'
      });
    }

    const insertQuery = `
      INSERT INTO reservation (
        id_prestation,
        id_client,
        id_employe,
        id_prestataire,
        date_reservation,
        heure_debut,
        heure_fin,
        mode_paiement,
        statut,
        commentaire,
        annulee,
        supprimee,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await new Promise((resolve, reject) => {
      db.query(insertQuery, [
        id_prestation,
        id_client,
        id_employe || null,
        id_prestataire || prestationExists.id_prestataire,
        date_reservation,
        heure_debut,
        heure_fin,
        mode_paiement,
        statut,
        commentaire || null,
        annulee,
        supprimee
      ], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });

    const reservationQuery = `
      SELECT 
        r.*,
        p.titre as prestation_titre,
        p.prix,
        c.prenom as client_prenom,
        c.nom as client_nom
      FROM reservation r
      JOIN prestation p ON r.id_prestation = p.id_prestation
      JOIN client c ON r.id_client = c.id_client
      WHERE r.id_reservation = ?
    `;

    const reservation = await new Promise((resolve, reject) => {
      db.query(reservationQuery, [result.insertId], (error, results) => {
        if (error) reject(error);
        resolve(results[0]);
      });
    });

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      reservation: reservation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de la réservation',
      details: error.message
    });
  }
});

// Endpoint pour mettre à jour un client
// =============================================
// ENDPOINT UNIFIÉ DE MISE À JOUR DE PROFIL (CORRIGÉ)
// =============================================

app.put('/api/update-profile', async (req, res) => {
  try {
    const { id, type_utilisateur, prenom, nom, mail, numero, adresse, ville, code_postal } = req.body;
    
    // Validation des champs obligatoires
    if (!id || !type_utilisateur || !prenom || !nom || !mail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Champs obligatoires manquants' 
      });
    }

    let tableName, idField;
    
    // Déterminer la table en fonction du type d'utilisateur
    switch(type_utilisateur) {
      case 'client':
        tableName = 'client';
        idField = 'id_client';
        break;
      case 'prestataire':
        tableName = 'prestataire';
        idField = 'id_prestataire';
        break;
      case 'employe':
        tableName = 'employe';
        idField = 'id_employe';
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Type d\'utilisateur invalide' 
        });
    }

    // Vérifier que l'utilisateur existe
    const userExists = await new Promise((resolve, reject) => {
      db.query(`SELECT ${idField} FROM ${tableName} WHERE ${idField} = ?`, [id], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    const emailCheck = await new Promise((resolve, reject) => {
      db.query(`SELECT ${idField} FROM ${tableName} WHERE mail = ? AND ${idField} != ?`, [mail, id], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (emailCheck) {
      return res.status(409).json({ 
        success: false, 
        error: 'Cet email est déjà utilisé par un autre utilisateur' 
      });
    }

    // Construire la requête de mise à jour (sans date_modification)
    let query = `UPDATE ${tableName} SET prenom = ?, nom = ?, mail = ?, numero = ?`;
    const values = [prenom, nom, mail, numero || null];

    // Ajouter les champs optionnels s'ils existent
    if (adresse !== undefined) {
      query += ', adresse = ?';
      values.push(adresse || null);
    }
    if (ville !== undefined) {
      query += ', ville = ?';
      values.push(ville || null);
    }
    if (code_postal !== undefined) {
      query += ', code_postal = ?';
      values.push(code_postal || null);
    }

    // AJOUTER L'UPDATE DE date_inscription POUR TOUTES LES TABLES
    // car toutes vos tables ont cette colonne selon votre schéma
    query += ', date_inscription = NOW()';

    query += ` WHERE ${idField} = ?`;
    values.push(id);

    // Exécuter la mise à jour
    await new Promise((resolve, reject) => {
      db.query(query, values, (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });

    // Récupérer les informations mises à jour
    const updatedUser = await new Promise((resolve, reject) => {
      db.query(
        `SELECT ${idField} as id, prenom, nom, mail, numero, adresse, ville, code_postal FROM ${tableName} WHERE ${idField} = ?`,
        [id],
        (error, results) => {
          if (error) reject(error);
          resolve(results[0]);
        }
      );
    });

    res.json({ 
      success: true, 
      message: `Profil ${type_utilisateur} mis à jour avec succès`,
      profil: updatedUser
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la mise à jour du profil',
      details: error.message 
    });
  }
});

// =============================================
// ENDPOINTS INDIVIDUELS CORRIGÉS
// =============================================

// Endpoint pour mettre à jour un client (CORRIGÉ)
app.put('/api/update-client-profile', async (req, res) => {
  try {
    const { id, prenom, nom, mail, numero, adresse, ville, code_postal } = req.body;
    
    // Validation des champs obligatoires
    if (!id || !prenom || !nom || !mail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Champs obligatoires manquants' 
      });
    }

    // Vérifier que le client existe
    const clientExists = await new Promise((resolve, reject) => {
      db.query('SELECT id_client FROM client WHERE id_client = ?', [id], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (!clientExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Client non trouvé' 
      });
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre client
    const emailCheck = await new Promise((resolve, reject) => {
      db.query('SELECT id_client FROM client WHERE mail = ? AND id_client != ?', [mail, id], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (emailCheck) {
      return res.status(409).json({ 
        success: false, 
        error: 'Cet email est déjà utilisé par un autre utilisateur' 
      });
    }

    // Mettre à jour le client (SANS date_modification)
    const query = `
      UPDATE client 
      SET prenom = ?, nom = ?, mail = ?, numero = ?, 
          adresse = ?, ville = ?, code_postal = ?,
          date_inscription = NOW()
      WHERE id_client = ?
    `;
    
    await new Promise((resolve, reject) => {
      db.query(query, [
        prenom,
        nom,
        mail,
        numero || null,
        adresse || null,
        ville || null,
        code_postal || null,
        id
      ], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });

    // Récupérer les informations mises à jour
    const updatedClient = await new Promise((resolve, reject) => {
      db.query(
        'SELECT id_client, prenom, nom, mail, numero, adresse, ville, code_postal FROM client WHERE id_client = ?',
        [id],
        (error, results) => {
          if (error) reject(error);
          resolve(results[0]);
        }
      );
    });

    res.json({ 
      success: true, 
      message: 'Profil client mis à jour avec succès',
      profil: updatedClient
    });

  } catch (error) {
    console.error('Erreur mise à jour client:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la mise à jour du profil',
      details: error.message 
    });
  }
});

// Endpoint pour mettre à jour un prestataire (CORRIGÉ)
app.put('/api/update-prestataire-profile', async (req, res) => {
  try {
    const { id, prenom, nom, mail, numero, adresse, ville, code_postal } = req.body;
    
    // Validation des champs obligatoires
    if (!id || !prenom || !nom || !mail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Champs obligatoires manquants' 
      });
    }

    // Vérifier que le prestataire existe
    const prestataireExists = await new Promise((resolve, reject) => {
      db.query('SELECT id_prestataire FROM prestataire WHERE id_prestataire = ?', [id], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (!prestataireExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prestataire non trouvé' 
      });
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre prestataire
    const emailCheck = await new Promise((resolve, reject) => {
      db.query('SELECT id_prestataire FROM prestataire WHERE mail = ? AND id_prestataire != ?', [mail, id], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (emailCheck) {
      return res.status(409).json({ 
        success: false, 
        error: 'Cet email est déjà utilisé par un autre prestataire' 
      });
    }

    // Mettre à jour le prestataire
    const query = `
      UPDATE prestataire 
      SET prenom = ?, nom = ?, mail = ?, numero = ?, 
          adresse = ?, ville = ?, code_postal = ?,
          date_inscription = NOW()
      WHERE id_prestataire = ?
    `;
    
    await new Promise((resolve, reject) => {
      db.query(query, [
        prenom,
        nom,
        mail,
        numero || null,
        adresse || null,
        ville || null,
        code_postal || null,
        id
      ], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });

    // Récupérer les informations mises à jour
    const updatedPrestataire = await new Promise((resolve, reject) => {
      db.query(
        'SELECT id_prestataire, prenom, nom, mail, numero, adresse, ville, code_postal FROM prestataire WHERE id_prestataire = ?',
        [id],
        (error, results) => {
          if (error) reject(error);
          resolve(results[0]);
        }
      );
    });

    res.json({ 
      success: true, 
      message: 'Profil prestataire mis à jour avec succès',
      profil: updatedPrestataire
    });

  } catch (error) {
    console.error('Erreur mise à jour prestataire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la mise à jour du profil',
      details: error.message 
    });
  }
});

// Endpoint pour mettre à jour un employé (CORRIGÉ)
app.put('/api/update-employe-profile', async (req, res) => {
  try {
    const { id, prenom, nom, mail, numero, adresse, ville, code_postal } = req.body;
    
    // Validation des champs obligatoires
    if (!id || !prenom || !nom || !mail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Champs obligatoires manquants' 
      });
    }

    // Vérifier que l'employé existe
    const employeExists = await new Promise((resolve, reject) => {
      db.query('SELECT id_employe FROM employe WHERE id_employe = ?', [id], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (!employeExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employé non trouvé' 
      });
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre employé
    const emailCheck = await new Promise((resolve, reject) => {
      db.query('SELECT id_employe FROM employe WHERE mail = ? AND id_employe != ?', [mail, id], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });

    if (emailCheck) {
      return res.status(409).json({ 
        success: false, 
        error: 'Cet email est déjà utilisé par un autre employé' 
      });
    }

    // Mettre à jour l'employé (SANS date_modification)
    const query = `
      UPDATE employe 
      SET prenom = ?, nom = ?, mail = ?, numero = ?, 
          adresse = ?, ville = ?, code_postal = ?,
          date_creation = NOW()
      WHERE id_employe = ?
    `;
    
    await new Promise((resolve, reject) => {
      db.query(query, [
        prenom,
        nom,
        mail,
        numero || null,
        adresse || null,
        ville || null,
        code_postal || null,
        id
      ], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });

    // Récupérer les informations mises à jour
    const updatedEmploye = await new Promise((resolve, reject) => {
      db.query(
        'SELECT id_employe, prenom, nom, mail, numero, adresse, ville, code_postal FROM employe WHERE id_employe = ?',
        [id],
        (error, results) => {
          if (error) reject(error);
          resolve(results[0]);
        }
      );
    });

    res.json({ 
      success: true, 
      message: 'Profil employé mis à jour avec succès',
      profil: updatedEmploye
    });

  } catch (error) {
    console.error('Erreur mise à jour employé:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la mise à jour du profil',
      details: error.message 
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Serveur API démarré sur http://127.0.0.1:${port}`);
});