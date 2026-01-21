-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:8889
-- Généré le : lun. 17 nov. 2025 à 01:29
-- Version du serveur : 5.7.39
-- Version de PHP : 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `planity_new`
--

-- --------------------------------------------------------

--
-- Structure de la table `avis`
--

CREATE TABLE `avis` (
  `id_avis` int(11) NOT NULL,
  `id_client` int(11) DEFAULT NULL,
  `id_prestataire` int(11) NOT NULL,
  `note` int(11) NOT NULL,
  `commentaire` text,
  `reponse` text,
  `date_avis` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `client`
--

CREATE TABLE `client` (
  `id_client` int(11) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `mail` varchar(100) NOT NULL,
  `genre` enum('femme','homme','autre') DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `pays` varchar(100) NOT NULL,
  `numero` varchar(15) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `date_inscription` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `commande`
--

CREATE TABLE `commande` (
  `id_commande` int(11) NOT NULL,
  `id_client` int(11) DEFAULT NULL,
  `date_commande` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `etat` enum('en cours','terminée','annulée') NOT NULL DEFAULT 'en cours'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `conges_employe`
--

CREATE TABLE `conges_employe` (
  `id_conge` int(11) NOT NULL,
  `id_employe` int(11) NOT NULL,
  `id_prestataire` int(11) NOT NULL,
  `type_conge` enum('vacances','maladie','personnel','formation','autre') NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `statut` enum('planifié','en_cours','terminé','annulé') NOT NULL DEFAULT 'planifié',
  `raison` text,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `conges_prestataire`
--

CREATE TABLE `conges_prestataire` (
  `id_conge` int(11) NOT NULL,
  `id_prestataire` int(11) NOT NULL,
  `type_conge` enum('vacances','maladie','personnel','formation','autre') NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `statut` enum('planifié','en_cours','terminé','annulé') NOT NULL DEFAULT 'planifié',
  `raison` text,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `employe`
--

CREATE TABLE `employe` (
  `id_employe` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `genre` enum('femme','homme','autre') NOT NULL,
  `date_naissance` date NOT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `pays` varchar(100) NOT NULL,
  `numero` varchar(15) NOT NULL,
  `mail` varchar(100) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `id_prestataire` int(11) NOT NULL,
  `supprime` tinyint(1) NOT NULL DEFAULT '0',
  `categorie` text,
  `conge` tinyint(1) NOT NULL DEFAULT '0',
  `disponibilite` text,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `entreprise`
--

CREATE TABLE `entreprise` (
  `id_entreprise` int(11) NOT NULL,
  `id_prestataire` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `forfait` varchar(50) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `numero` varchar(15) DEFAULT NULL,
  `informations` text,
  `url_image` mediumblob,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `horaires_salon`
--

CREATE TABLE `horaires_salon` (
  `id` int(11) NOT NULL,
  `id_entreprise` int(11) NOT NULL,
  `jour_semaine` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') NOT NULL,
  `heure_ouverture` time NOT NULL,
  `heure_fermeture` time NOT NULL,
  `is_ferme` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `horaires_salon_pause`
--

CREATE TABLE `horaires_salon_pause` (
  `id` int(11) NOT NULL,
  `salon_id` int(11) DEFAULT NULL,
  `jour_semaine` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `jours_feries`
--

CREATE TABLE `jours_feries` (
  `id_jour` int(11) NOT NULL,
  `date_jour` date NOT NULL,
  `nom` varchar(100) NOT NULL,
  `pays` varchar(50) NOT NULL DEFAULT 'France',
  `recurrence` enum('annuel','ponctuel') NOT NULL DEFAULT 'annuel',
  `actif` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `livraison`
--

CREATE TABLE `livraison` (
  `id_livraison` int(11) NOT NULL,
  `id_commande` int(11) NOT NULL,
  `adresse_livraison` varchar(255) NOT NULL,
  `date_livraison` datetime NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `paiement`
--

CREATE TABLE `paiement` (
  `id_paiement` int(11) NOT NULL,
  `id_reservation` int(11) NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `mode_paiement` enum('en ligne','en espèces') NOT NULL DEFAULT 'en ligne',
  `etat` enum('payé','en attente','annulé') NOT NULL DEFAULT 'en attente',
  `date_paiement` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `panier`
--

CREATE TABLE `panier` (
  `id_panier` int(11) NOT NULL,
  `id_client` int(11) DEFAULT NULL,
  `id_produit` int(11) NOT NULL,
  `quantite` int(11) NOT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `photo_employe`
--

CREATE TABLE `photo_employe` (
  `id_photo` int(11) NOT NULL,
  `id_employe` int(11) NOT NULL,
  `url_photo` mediumblob,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `photo_prestataire`
--

CREATE TABLE `photo_prestataire` (
  `id_photo` int(11) NOT NULL,
  `id_prestataire` int(11) NOT NULL,
  `url_photo` mediumblob,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `prestataire`
--

CREATE TABLE `prestataire` (
  `id_prestataire` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `mail` varchar(100) NOT NULL,
  `genre` enum('femme','homme','autre') NOT NULL,
  `date_naissance` date NOT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `numero` varchar(15) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `code_postal` varchar(10) NOT NULL,
  `pays` varchar(100) NOT NULL,
  `categorie` text,
  `disponibilite` text,
  `conge` tinyint(1) NOT NULL DEFAULT '0',
  `date_inscription` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `prestation`
--

CREATE TABLE `prestation` (
  `id_prestation` int(11) NOT NULL,
  `titre` varchar(100) NOT NULL,
  `prix` decimal(10,2) NOT NULL,
  `description` text,
  `temps` int(11) NOT NULL,
  `id_prestataire` int(11) NOT NULL,
  `categorie` enum('Coiffeur','Ongles','soins','autre') NOT NULL,
  `nom_categorie` varchar(255) DEFAULT NULL,
  `supprime` tinyint(1) NOT NULL DEFAULT '0',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `produit`
--

CREATE TABLE `produit` (
  `id_produit` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text,
  `prix` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `id_prestataire` int(11) NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `reservation`
--

CREATE TABLE `reservation` (
  `id_reservation` int(11) NOT NULL,
  `id_prestation` int(11) NOT NULL,
  `id_client` int(11) DEFAULT NULL,
  `id_employe` int(11) DEFAULT NULL,
  `date_reservation` datetime NOT NULL,
  `mode_paiement` enum('en ligne','en espèces') NOT NULL DEFAULT 'en ligne',
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `statut` enum('disponible','reservé','indisponible') DEFAULT 'disponible',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `annulee` tinyint(1) NOT NULL DEFAULT '0',
  `supprimee` tinyint(1) NOT NULL DEFAULT '0',
  `id_prestataire` int(11) DEFAULT NULL,
  `commentaire` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `stats_clients_supprimes`
--

CREATE TABLE `stats_clients_supprimes` (
  `id_stat` int(11) NOT NULL,
  `id_prestataire` int(11) NOT NULL,
  `periode` varchar(7) NOT NULL,
  `nb_clients_supprimes` int(11) NOT NULL DEFAULT '0',
  `nb_reservations` int(11) NOT NULL DEFAULT '0',
  `chiffre_affaire` decimal(10,2) NOT NULL DEFAULT '0.00',
  `date_mise_a_jour` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `types_conge`
--

CREATE TABLE `types_conge` (
  `id_type` int(11) NOT NULL,
  `nom_type` varchar(50) NOT NULL,
  `description` text,
  `couleur` varchar(7) DEFAULT '#3498db',
  `actif` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_clients_actifs`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `vue_clients_actifs` (
`id_client` int(11)
,`prenom` varchar(50)
,`nom` varchar(50)
,`mail` varchar(100)
,`numero` varchar(15)
,`nb_reservations` bigint(21)
,`total_depense` decimal(32,2)
,`derniere_visite` datetime
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_conges_consolides`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `vue_conges_consolides` (
`type_utilisateur` varchar(11)
,`id_conge` int(11)
,`id_utilisateur` int(11)
,`prenom` varchar(50)
,`nom` varchar(50)
,`mail` varchar(100)
,`type_conge` varchar(9)
,`date_debut` date
,`date_fin` date
,`statut` varchar(8)
,`raison` mediumtext
,`date_creation` datetime
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_stats_anciens_clients`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `vue_stats_anciens_clients` (
`id_prestataire` int(11)
,`total_clients` decimal(32,0)
,`total_reservations` decimal(32,0)
,`total_ca` decimal(32,2)
,`derniere_mise_a_jour` datetime
);

-- --------------------------------------------------------

--
-- Structure de la vue `vue_clients_actifs`
--
DROP TABLE IF EXISTS `vue_clients_actifs`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_clients_actifs`  AS SELECT `c`.`id_client` AS `id_client`, `c`.`prenom` AS `prenom`, `c`.`nom` AS `nom`, `c`.`mail` AS `mail`, `c`.`numero` AS `numero`, count(`r`.`id_reservation`) AS `nb_reservations`, coalesce(sum(`p`.`prix`),0) AS `total_depense`, max(`r`.`date_reservation`) AS `derniere_visite` FROM ((`client` `c` left join `reservation` `r` on(((`c`.`id_client` = `r`.`id_client`) and (`r`.`id_client` is not null)))) left join `prestation` `p` on((`r`.`id_prestation` = `p`.`id_prestation`))) GROUP BY `c`.`id_client` ORDER BY `derniere_visite` AS `DESCdesc` ASC  ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_conges_consolides`
--
DROP TABLE IF EXISTS `vue_conges_consolides`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_conges_consolides`  AS SELECT 'prestataire' AS `type_utilisateur`, `cp`.`id_conge` AS `id_conge`, `cp`.`id_prestataire` AS `id_utilisateur`, `p`.`prenom` AS `prenom`, `p`.`nom` AS `nom`, `p`.`mail` AS `mail`, `cp`.`type_conge` AS `type_conge`, `cp`.`date_debut` AS `date_debut`, `cp`.`date_fin` AS `date_fin`, `cp`.`statut` AS `statut`, `cp`.`raison` AS `raison`, `cp`.`date_creation` AS `date_creation` FROM (`conges_prestataire` `cp` join `prestataire` `p` on((`cp`.`id_prestataire` = `p`.`id_prestataire`))) union all select 'employe' AS `type_utilisateur`,`ce`.`id_conge` AS `id_conge`,`ce`.`id_employe` AS `id_utilisateur`,`e`.`prenom` AS `prenom`,`e`.`nom` AS `nom`,`e`.`mail` AS `mail`,`ce`.`type_conge` AS `type_conge`,`ce`.`date_debut` AS `date_debut`,`ce`.`date_fin` AS `date_fin`,`ce`.`statut` AS `statut`,`ce`.`raison` AS `raison`,`ce`.`date_creation` AS `date_creation` from (`conges_employe` `ce` join `employe` `e` on((`ce`.`id_employe` = `e`.`id_employe`)))  ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_stats_anciens_clients`
--
DROP TABLE IF EXISTS `vue_stats_anciens_clients`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_stats_anciens_clients`  AS SELECT `stats_clients_supprimes`.`id_prestataire` AS `id_prestataire`, sum(`stats_clients_supprimes`.`nb_clients_supprimes`) AS `total_clients`, sum(`stats_clients_supprimes`.`nb_reservations`) AS `total_reservations`, sum(`stats_clients_supprimes`.`chiffre_affaire`) AS `total_ca`, max(`stats_clients_supprimes`.`date_mise_a_jour`) AS `derniere_mise_a_jour` FROM `stats_clients_supprimes` GROUP BY `stats_clients_supprimes`.`id_prestataire``id_prestataire`  ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `avis`
--
ALTER TABLE `avis`
  ADD PRIMARY KEY (`id_avis`),
  ADD KEY `id_prestataire` (`id_prestataire`),
  ADD KEY `avis_ibfk_1` (`id_client`);

--
-- Index pour la table `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`id_client`),
  ADD UNIQUE KEY `mail` (`mail`),
  ADD UNIQUE KEY `mail_2` (`mail`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD UNIQUE KEY `numero_2` (`numero`);

--
-- Index pour la table `commande`
--
ALTER TABLE `commande`
  ADD PRIMARY KEY (`id_commande`),
  ADD KEY `commande_ibfk_1` (`id_client`);

--
-- Index pour la table `conges_employe`
--
ALTER TABLE `conges_employe`
  ADD PRIMARY KEY (`id_conge`),
  ADD KEY `idx_employe` (`id_employe`),
  ADD KEY `idx_prestataire` (`id_prestataire`),
  ADD KEY `idx_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_statut` (`statut`);

--
-- Index pour la table `conges_prestataire`
--
ALTER TABLE `conges_prestataire`
  ADD PRIMARY KEY (`id_conge`),
  ADD KEY `idx_prestataire` (`id_prestataire`),
  ADD KEY `idx_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_statut` (`statut`);

--
-- Index pour la table `employe`
--
ALTER TABLE `employe`
  ADD PRIMARY KEY (`id_employe`),
  ADD UNIQUE KEY `mail` (`mail`),
  ADD UNIQUE KEY `mail_2` (`mail`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD UNIQUE KEY `numero_2` (`numero`),
  ADD KEY `id_prestataire` (`id_prestataire`);

--
-- Index pour la table `entreprise`
--
ALTER TABLE `entreprise`
  ADD PRIMARY KEY (`id_entreprise`),
  ADD UNIQUE KEY `id_prestataire` (`id_prestataire`);

--
-- Index pour la table `horaires_salon`
--
ALTER TABLE `horaires_salon`
  ADD PRIMARY KEY (`id`),
  ADD KEY `horaires_salon_ibfk_1` (`id_entreprise`);

--
-- Index pour la table `horaires_salon_pause`
--
ALTER TABLE `horaires_salon_pause`
  ADD PRIMARY KEY (`id`),
  ADD KEY `salon_id` (`salon_id`);

--
-- Index pour la table `jours_feries`
--
ALTER TABLE `jours_feries`
  ADD PRIMARY KEY (`id_jour`),
  ADD UNIQUE KEY `unique_date_pays` (`date_jour`,`pays`),
  ADD KEY `idx_date` (`date_jour`),
  ADD KEY `idx_pays` (`pays`);

--
-- Index pour la table `livraison`
--
ALTER TABLE `livraison`
  ADD PRIMARY KEY (`id_livraison`),
  ADD KEY `id_commande` (`id_commande`);

--
-- Index pour la table `paiement`
--
ALTER TABLE `paiement`
  ADD PRIMARY KEY (`id_paiement`),
  ADD KEY `id_reservation` (`id_reservation`);

--
-- Index pour la table `panier`
--
ALTER TABLE `panier`
  ADD PRIMARY KEY (`id_panier`),
  ADD KEY `id_produit` (`id_produit`),
  ADD KEY `panier_ibfk_1` (`id_client`);

--
-- Index pour la table `photo_employe`
--
ALTER TABLE `photo_employe`
  ADD PRIMARY KEY (`id_photo`),
  ADD KEY `id_employe` (`id_employe`);

--
-- Index pour la table `photo_prestataire`
--
ALTER TABLE `photo_prestataire`
  ADD PRIMARY KEY (`id_photo`),
  ADD KEY `id_prestataire` (`id_prestataire`);

--
-- Index pour la table `prestataire`
--
ALTER TABLE `prestataire`
  ADD PRIMARY KEY (`id_prestataire`),
  ADD UNIQUE KEY `mail` (`mail`),
  ADD UNIQUE KEY `mail_2` (`mail`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD UNIQUE KEY `numero_2` (`numero`);

--
-- Index pour la table `prestation`
--
ALTER TABLE `prestation`
  ADD PRIMARY KEY (`id_prestation`),
  ADD KEY `id_prestataire` (`id_prestataire`);

--
-- Index pour la table `produit`
--
ALTER TABLE `produit`
  ADD PRIMARY KEY (`id_produit`),
  ADD KEY `id_prestataire` (`id_prestataire`);

--
-- Index pour la table `reservation`
--
ALTER TABLE `reservation`
  ADD PRIMARY KEY (`id_reservation`),
  ADD KEY `id_prestation` (`id_prestation`),
  ADD KEY `id_employe` (`id_employe`),
  ADD KEY `fk_reservation_prestataire` (`id_prestataire`),
  ADD KEY `reservation_ibfk_2` (`id_client`);

--
-- Index pour la table `stats_clients_supprimes`
--
ALTER TABLE `stats_clients_supprimes`
  ADD PRIMARY KEY (`id_stat`),
  ADD UNIQUE KEY `periode_prestataire` (`id_prestataire`,`periode`);

--
-- Index pour la table `types_conge`
--
ALTER TABLE `types_conge`
  ADD PRIMARY KEY (`id_type`),
  ADD UNIQUE KEY `unique_nom` (`nom_type`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `avis`
--
ALTER TABLE `avis`
  MODIFY `id_avis` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `client`
--
ALTER TABLE `client`
  MODIFY `id_client` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `commande`
--
ALTER TABLE `commande`
  MODIFY `id_commande` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `conges_employe`
--
ALTER TABLE `conges_employe`
  MODIFY `id_conge` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `conges_prestataire`
--
ALTER TABLE `conges_prestataire`
  MODIFY `id_conge` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `employe`
--
ALTER TABLE `employe`
  MODIFY `id_employe` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `entreprise`
--
ALTER TABLE `entreprise`
  MODIFY `id_entreprise` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `horaires_salon`
--
ALTER TABLE `horaires_salon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `horaires_salon_pause`
--
ALTER TABLE `horaires_salon_pause`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `jours_feries`
--
ALTER TABLE `jours_feries`
  MODIFY `id_jour` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `livraison`
--
ALTER TABLE `livraison`
  MODIFY `id_livraison` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `paiement`
--
ALTER TABLE `paiement`
  MODIFY `id_paiement` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `panier`
--
ALTER TABLE `panier`
  MODIFY `id_panier` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `photo_employe`
--
ALTER TABLE `photo_employe`
  MODIFY `id_photo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `photo_prestataire`
--
ALTER TABLE `photo_prestataire`
  MODIFY `id_photo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `prestataire`
--
ALTER TABLE `prestataire`
  MODIFY `id_prestataire` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `prestation`
--
ALTER TABLE `prestation`
  MODIFY `id_prestation` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `produit`
--
ALTER TABLE `produit`
  MODIFY `id_produit` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `reservation`
--
ALTER TABLE `reservation`
  MODIFY `id_reservation` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `stats_clients_supprimes`
--
ALTER TABLE `stats_clients_supprimes`
  MODIFY `id_stat` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `types_conge`
--
ALTER TABLE `types_conge`
  MODIFY `id_type` int(11) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `avis`
--
ALTER TABLE `avis`
  ADD CONSTRAINT `avis_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `client` (`id_client`),
  ADD CONSTRAINT `avis_ibfk_2` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `commande`
--
ALTER TABLE `commande`
  ADD CONSTRAINT `commande_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `client` (`id_client`);

--
-- Contraintes pour la table `conges_employe`
--
ALTER TABLE `conges_employe`
  ADD CONSTRAINT `conges_employe_ibfk_1` FOREIGN KEY (`id_employe`) REFERENCES `employe` (`id_employe`) ON DELETE CASCADE,
  ADD CONSTRAINT `conges_employe_ibfk_2` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `conges_prestataire`
--
ALTER TABLE `conges_prestataire`
  ADD CONSTRAINT `conges_prestataire_ibfk_1` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `employe`
--
ALTER TABLE `employe`
  ADD CONSTRAINT `employe_ibfk_1` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `entreprise`
--
ALTER TABLE `entreprise`
  ADD CONSTRAINT `entreprise_ibfk_1` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `horaires_salon`
--
ALTER TABLE `horaires_salon`
  ADD CONSTRAINT `horaires_salon_ibfk_1` FOREIGN KEY (`id_entreprise`) REFERENCES `entreprise` (`id_entreprise`) ON DELETE CASCADE;

--
-- Contraintes pour la table `horaires_salon_pause`
--
ALTER TABLE `horaires_salon_pause`
  ADD CONSTRAINT `horaires_salon_pause_ibfk_1` FOREIGN KEY (`salon_id`) REFERENCES `horaires_salon` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `livraison`
--
ALTER TABLE `livraison`
  ADD CONSTRAINT `livraison_ibfk_1` FOREIGN KEY (`id_commande`) REFERENCES `commande` (`id_commande`) ON DELETE CASCADE;

--
-- Contraintes pour la table `paiement`
--
ALTER TABLE `paiement`
  ADD CONSTRAINT `paiement_ibfk_1` FOREIGN KEY (`id_reservation`) REFERENCES `reservation` (`id_reservation`) ON DELETE CASCADE;

--
-- Contraintes pour la table `panier`
--
ALTER TABLE `panier`
  ADD CONSTRAINT `panier_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `client` (`id_client`),
  ADD CONSTRAINT `panier_ibfk_2` FOREIGN KEY (`id_produit`) REFERENCES `produit` (`id_produit`) ON DELETE CASCADE;

--
-- Contraintes pour la table `photo_employe`
--
ALTER TABLE `photo_employe`
  ADD CONSTRAINT `photo_employe_ibfk_1` FOREIGN KEY (`id_employe`) REFERENCES `employe` (`id_employe`) ON DELETE CASCADE;

--
-- Contraintes pour la table `photo_prestataire`
--
ALTER TABLE `photo_prestataire`
  ADD CONSTRAINT `photo_prestataire_ibfk_1` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `prestation`
--
ALTER TABLE `prestation`
  ADD CONSTRAINT `prestation_ibfk_1` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `produit`
--
ALTER TABLE `produit`
  ADD CONSTRAINT `produit_ibfk_1` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `fk_reservation_prestataire` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`),
  ADD CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`id_prestation`) REFERENCES `prestation` (`id_prestation`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservation_ibfk_2` FOREIGN KEY (`id_client`) REFERENCES `client` (`id_client`),
  ADD CONSTRAINT `reservation_ibfk_3` FOREIGN KEY (`id_employe`) REFERENCES `employe` (`id_employe`) ON DELETE SET NULL;

--
-- Contraintes pour la table `stats_clients_supprimes`
--
ALTER TABLE `stats_clients_supprimes`
  ADD CONSTRAINT `stats_clients_supprimes_ibfk_1` FOREIGN KEY (`id_prestataire`) REFERENCES `prestataire` (`id_prestataire`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
