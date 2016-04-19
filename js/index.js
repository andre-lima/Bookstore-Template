/*
Autheur: Andre Dantas Lima
ift-1142
TP3
*/

//Tableau et variables globales
books = [];
panier = [];
tempLivres = [];
categories = [];
panierOuvert = false;
prixTotal = 0;
estPanierVide = true;


$(function() {

    path = location.origin;
    console.log(path);

    //Charge les quotes
    $.ajax({
        url: 'server/quotes.json',
        type: 'GET',
        dataType: 'JSON',
        error: function() {
            alert('Erreur chargement');
        },
        success: function(data) {
            var quotes = data;
            console.log("loading quotes...");
            var $afficheQuote = $("#quote");
            var $afficheAuteur = $("#auteur");
            var randomQuote = Math.floor(Math.random() * quotes.length);

            $afficheQuote.html('"' + quotes[randomQuote].quote + '"');
            $afficheAuteur.html('"' + quotes[randomQuote].auteur + '"');
        }
    });

    //Si on click sur le logo, on va a la page d'accueil
    $('#logo').on('click', function(e) {
        e.preventDefault();
        loadContenuPrincipal("accueil");
        $('.active').removeClass("active");
        $('#accueil').addClass("active");
    });

    //Vide le panier
    var $tableDuPanier = $('#table-panier');
    $tableDuPanier.html('');

    //Si panier est sauvegardé dans localStorage, rempli-le
    if (window.localStorage && localStorage.getItem("dans_panier") != null)
        tempLivres = JSON.parse(localStorage.getItem("dans_panier"));

    //Faire le casting de Object -> Livre
    for (var i of tempLivres) {
        var t = new Livre();
        t.Livre(i);
        panier.push(t); //Push dans le tableau 'panier'
    }
    remplirPanier(); //Avec les livres du localStorage

    //Affiche la date et heure
    setInterval(setDate, 1000);

    function setDate() {
        var dt = new Date();
        var time = dt.getDate() + "/" + dt.getMonth() + "/" + dt.getFullYear() + "&nbsp&nbsp&nbsp&nbsp" + reglerZero(dt.getHours()) + ":" + reglerZero(dt.getMinutes()) + ":" + reglerZero(dt.getSeconds());
        $('#date').html(time);

        function reglerZero(date) {
            return date < 10 ? '0' + date : date;
        }
    }

    //Set le tab active quand on click sur nav
    $('#nav-tabs li').on('click', function(e) {
        $('#nav-tabs li.active').removeClass('active');
        $(this).addClass('active');
        $tabActive = $(this).attr('id');

        loadContenuPrincipal($tabActive);
    });

    //Appelle l'information de Contact
    $('#contact').on('click', function(e) {
        $.ajax({
            url: 'pages/contact.html#affiche-contact',
            type: 'GET',
            dataType: 'HTML',
            error: function() {
                alert('Erreur chargement');
            },
            success: function(data) {
                $('.active').removeClass("active");
                $('#display-main').html(data);
            }
        });
    });

    //Enlevez tous les livres de l'affichage
    $('#display-books').html('');

    //Load categories.json avec AJAX et les ajoute dans la liste
    function loadCategories() {
        $.ajax({
            url: 'server/categories.json',
            type: 'GET',
            dataType: 'JSON',
            error: function() {
                alert('Erreur chargement');
            },
            success: function(data) {
                console.log("loading categories...");
                categories = data[0].categories;

                //Ajoute les categories du fichier dans la liste (ul)
                var $ulCateg = $("#menu-categories")
                for (var c of categories) {
                    var $cat = $("<li></li>");
                    var $link = $("<a href='#'></a>");
                    $link.text(c);
                    $cat.append($link);
                    $cat.addClass('categ-item');
                    $cat.attr('id', c);
                    $cat.on("click", function(e) {
                        e.preventDefault();
                        var categChoisi = $(this).attr('id');

                        loadContenuParCategorie(categChoisi);
                    });
                    $ulCateg.append($cat);
                }
            }
        });
    }
    loadCategories();

    //Charge categories.html et affiche les livres choisis
    function loadContenuParCategorie(categ) {
        $.ajax({
            url: 'pages/categories.html#affiche-categories',
            type: 'GET',
            dataType: 'HTML',
            error: function() {
                alert('Erreur chargement');
            },
            success: function(data) {
                console.log("loading " + categ + "...");
                $('#display-main').html(data); //Afiche le layout

                //Prends les livres filtrés par categorie
                var livresFiltres = filtrerLivresParCategorie(categ)
                loadLivres(livresFiltres); //Charge les livres
                $('#nom-categorie').text(categ + "!");

                //S'il n'y a pas de livres, affiche une message
                if ($('#display-books').children()[0] == undefined)
                    $('#display-books').html("<p style='padding: 10px' class='alert alert-danger'>Pas de livres disponibles pour cette categorie. Nous sommes désolés!</p>");
            }
        });
    }

    //Filtre les livres par categorie désiré
    function filtrerLivresParCategorie(categ) {
        var tempLivres = [];

        for (var i = 0; i < books.length; i++) {
            if (categ == "Tout")
                tempLivres.push(books[i]); //Affiche tout
            else if (books[i].category == categ)
                tempLivres.push(books[i]); //Affiche si dans la categories désiré
            else if (categ == "Autres" && categories.indexOf(books[i].category) < 0)
                tempLivres.push(books[i]); //Si la categorie n'est pas dans la liste, affiche si l'usage a choisi la categ 'Autres'
        }
        return tempLivres;
    }

    //Charge le layout et livres pour l'option 'Accueil' et 'Nouveauté'
    function loadContenuPrincipal(contenu) {
        if (contenu != "categories") {
            $.ajax({
                url: 'pages/' + contenu + '.html#affiche-' + contenu,
                type: 'GET',
                dataType: 'HTML',
                error: function() {
                    alert('Erreur chargement');
                },
                success: function(data) {
                    console.log("loading " + contenu + "...");
                    $('#display-main').html(data);
                    var livresFiltres = filtrerLivresParNouveaute(contenu)
                    loadLivres(livresFiltres);
                }
            });
        }
    }

    function filtrerLivresParNouveaute(contenu) {
        var tempLivres = [];

        switch (contenu) {
            case "accueil":
                retourneLivresFiltresParNouveaute(3); //Affiche que 3 livres
                break;
            case "nouveaute":
                retourneLivresFiltresParNouveaute(books.length); //Affiche tout les nouveautés
                break;
        }

        //Affiche un maximum de 'qtt' nouveautés per page
        function retourneLivresFiltresParNouveaute(qtt) {
            for (var i = 0; i < books.length; i++) {
                if (books[i].new_release == true)
                    tempLivres.push(books[i]);
                if (tempLivres.length == qtt) //Si déjà atteint la qtt max, sortez du boucle
                    break;
            }
        }
        return tempLivres;
    }

    //Load tous les livres du JSON avec AJAX
    $.ajax({
        url: 'server/bookstore.json',
        type: 'GET',
        dataType: 'JSON',
        error: function() {
            alert('Erreur chargement');
        },
        success: function(data) {
            console.log("loading livres...");
            books = data;

            //Initialize dans l'onglet Accueil
            loadContenuPrincipal("accueil");
        }
    });


    //Regler le bouton "Payez"
    $('#btn-payez').on("click", function() {
        if ($('#btn-payez').hasClass("disabled") == false) {
            $.ajax({
                url: 'pages/paiement.html#affiche-payez',
                type: 'GET',
                dataType: 'HTML',
                error: function() {
                    alert('Erreur chargement');
                },
                success: function(data) {
                    console.log("loading paiement...");
                    $('#display-main').html(data);
                    $('.active').removeClass("active");
                    $panier = $('#gros-panier');
                    for (var item of panier) {
                        var $new = $('<img style="z-index:' + randomNb(-10, -1) + ' ;transform: translate(' + randomNb(-55, 55) + 'px, ' + randomNb(-10, 10) + 'px) rotate(' + randomNb(-36, 36) + 'deg);" class="livre-mini" src="' + path + item.image + '" alt="cover" />');
                        $panier.append($new);
                        $('#prix-ici').text(prixTotal.toFixed(2));
                    }

                    function randomNb(min, max) {
                        return Math.floor(Math.random() * (max - min + 1)) + min;
                    }

                    //Écouteurs pour regler le click sur des modes de paiement
                    $('.bt-paiement').on('click', function() {
                        if (confirm("Vous voulez payer le montant de " + prixTotal.toFixed(2) + " avec " + this.title + "?")) {
                            $('#display-main').html("<h1 class='merci alert alert-success'>Merci pour votre achat!</h1>");
                            viderPanier();
                        }
                    });
                }
            });
        }
    });

    //Si on est dans la page de paiement, puis l'usager supprime un livre du panier, ici on mettre a jour la page de paiment
    function mettreAJourPanierAchats() {
        $panier = $('#gros-panier');
        $panier.html('');
        for (var i of panier) {
            var $new = $('<img style="z-index:' + randomNb(-10, -1) + ' ;transform: translate(' + randomNb(-55, 55) + 'px, ' + randomNb(-10, 10) + 'px) rotate(' + randomNb(-36, 36) + 'deg);" class="livre-mini" src="' + path + i.image + '" alt="cover" />');
            $panier.append($new);
            $('#prix-ici').text(prixTotal.toFixed(2));
        }

        function randomNb(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    }

    //Vide le panier
    function viderPanier() {
        var $tableDuPanier = $('#table-panier');
        $tableDuPanier.html('');
        panier = [];
        calculerPrixTotal();
        fermerPanier();
        reglerCerclePanier();
        estPanierVide = true;
    }


    //Prends le JSON initial avec les livres et categories et cree des objets Livre
    function loadLivres(books) {
        var unLivre = '';
        var $parent = $('#display-books');
        livres = [];

        for (var book of books) {
            var id = book.id;
            var image = book.image;
            var titre = book.title;
            var auteur = book.author.join(', ');
            var prix = book.price;
            var annee = book.year;
            var description = book.description;
            var nouveaute = book.new_release;
            var categorie = book.category;
            var qtt = book.in_cart;

            //Instancier un objet livre
            var livreObj = new Livre();
            livreObj.Livre(id, titre, auteur, prix, image, annee, description, nouveaute, categorie, qtt);

            $parent.append(livreObj.domFormatAffiche());

            //Cache l'étoile de nouveauté, si le livre n'est pas une nouveauté
            if (livreObj.nouveaute == false)
                $('#L' + livreObj.id).find('.nouveau-icon').addClass("hidden");

            //Ajoute écouteurs pour afficher les details du livre
            $('#D' + livreObj.id).on("click", function(e) {
                e.preventDefault();
                afficheDetails(this.id);
            });
            $('#T' + livreObj.id).on("click", function(e) {
                e.preventDefault();
                afficheDetails(this.id);
            });

            livres.push(livreObj);
        }

        ajouterDansPanier();
    }


    //Afficher details du livre cliqué
    function afficheDetails(livreId) {
        var livreId = livreId.substring(1);
        var detailsDom = '';
        $('.active').removeClass("active");

        //Loop et trouve le livre choisi. Puis on l'affiche
        $.each(livres, function(key, value) {
            if (value.id == livreId) {
                detailsDom = livres[key].domFormatDetails();
            } else {}
        });

        //Charge la page de details
        $.ajax({
            url: 'pages/details.html#affiche-details',
            type: 'GET',
            dataType: 'HTML',
            error: function() {
                alert('Erreur chargement');
            },
            success: function(data) {
                console.log("loading details...");
                $('#display-main').html(detailsDom);
                ajouterDansPanier();
            }
        });

    }

    //Regler les écouteurs pour ajouter livres dans le panier
    function ajouterDansPanier() {
        $('.ajouter').on('click', function(e) {
            e.preventDefault();
            var self = this;

            //Si l'objet livre est dans le tableau 'livres' mais pas dans le tableau 'panier', on peut l'ajouter
            $.each(livres, function(key, value) {
                if (value.id == self.getAttribute("value") && !estLivreDansPanier(panier, this)) {
                    if (this.qttDansPanier < 1)
                        this.qttDansPanier = 1; //Mets la qtt dans panier à 1
                    panier.push(this);

                }
            });

            function estLivreDansPanier(panier, livre) {
                for (var i of panier) {
                    if (i.id == livre.id)
                        return true;
                }
                return false;
            }

            remplirPanier();

        });
    } //Fin d'ajoute dans le panier

    function remplirPanier() {
        estPanierVide = false;
        var $tableDuPanier = $('#table-panier');
        $tableDuPanier.html('');

        for (var livreObj of panier) {
            $tableDuPanier.prepend(livreObj.domFormatPanier());
        }

        calculerPrixTotal(); //Calculer le prix aprés un ajout

        //Ajouter les ecouteurs d'evenements pour supprimer du panier
        $('a.supprimer').on('click', function(e) {
            e.preventDefault();
            var self = this;

            //Si l'objet livre est dans le tableau 'panier', on peut le supprimer
            $.each(panier, function(key, value) {
                if (value != undefined && value.id == self.getAttribute("value") && panier.indexOf(this) >= 0) {
                    $('#P' + value.id).fadeOut("slow");
                    panier.splice(panier.indexOf(this), 1);
                    this.qttDansPanier = 0; //Mets la qtt dans panier a zero
                }
            });
            reglerCerclePanier()
            calculerPrixTotal(); //Calculer le prix aprés une suppression
        }); //Fin de supprimer du panier

        //Ajouter les ecouteurs d'evenements pour changer la qtt de chaque livre
        $('.plus-minus').on('click', function(e) {
            e.preventDefault();
            var $self = $(this);

            //Si l'objet livre est dans le tableau 'panier', on peut changer la qtt
            $.each(panier, function(key, value) {
                if (value != undefined && value.id == $self.parent().attr("value") && panier.indexOf(this) >= 0) {
                    if ($self.hasClass("minus") && this.qttDansPanier > 1)
                        this.qttDansPanier--;
                    if ($self.hasClass("plus") && this.qttDansPanier < 99)
                        this.qttDansPanier++;

                    $self.parent().children(".livre-qtt").text(this.qttDansPanier);
                }

            });

            calculerPrixTotal(); //Calculer le prix aprés changer la qtt
        }); //Fin de change la qtt

        reglerCerclePanier()
    } //Fin du remplirPanier()

    //Regler l'affichage du cercle
    function reglerCerclePanier() {
        var $cerclePanier = $('#qtt-panier');

        //Affiche le cercle rouge qui montre la qtt d'items dans le panier
        if (panier.length > 0) {

            $cerclePanier.text(panier.length);
            $cerclePanier.removeClass("hidden");
            $cerclePanier.addClass("show");

            ouvrirPanier();
        } else {
            $cerclePanier.text(panier.length);

            $cerclePanier.fadeOut("slow", function() {
                $cerclePanier.addClass("hidden");
                $cerclePanier.removeClass("show");
            });

            fermerPanier();
        }
    } //Fin du reglerCerclePanier()

    function calculerPrixTotal() {
        var prixAvantTaxes = 0;
        var tps = 0.05;
        var tvq = 0.0975;

        for (var livreObj of panier) {
            prixAvantTaxes += livreObj.qttDansPanier * livreObj.prix;
        }
        $('#tps').text((prixAvantTaxes * tps).toFixed(2));
        $('#tvq').text((prixAvantTaxes * tvq).toFixed(2));
        prixTotal = prixAvantTaxes * (1 + tps + tvq);
        $('#a-payer').text(prixTotal.toFixed(2));

        //Sauvegarde panier dans localStorage s'il y a un changement dans le panier
        sauvegarderPanier(panier);

        //Change l'état du btn Payez. 'Disabled' si le panier est vide
        if (prixTotal == 0) {
            $('#btn-payez').addClass("disabled");

            //Si l'usager vider le panier lors qu'il est dans la page de paiement, on charge la page initial
            if ($('#gros-panier')[0] != undefined) {
                loadContenuPrincipal("accueil");
                $('.active').removeClass("active");
                $('#accueil').addClass("active");
            }
        } else {
            mettreAJourPanierAchats();
            $('#btn-payez').removeClass("disabled");
        }

    } //fin du calculerPrixTotal()

    //Ouvrir ou Fermer le panier
    $('#bt-panier').on('click', function(e) {
        e.preventDefault();
        if (panierOuvert)
            fermerPanier();
        else
            ouvrirPanier();
    })

    function ouvrirPanier() {
        var $affichePanier = $('#affiche-panier');
        panierOuvert = true;

        $affichePanier.animate({
            width: "33%"
        }, 800, function() {
            // Animation complete.
        });
    }

    function fermerPanier() {
        var $affichePanier = $('#affiche-panier');
        panierOuvert = false;

        $affichePanier.animate({
            width: "0%"
        }, 800, function() {
            //affichePanier.removeClass("show");
            //affichePanier.addClass("hidden");
        });
    }

    //Sauvegarde les livres dans le panier
    function sauvegarderPanier(panier) {
        if (window.localStorage)
            localStorage.setItem("dans_panier", JSON.stringify(panier));
    }

    //Print
    var $printPanier = $("#affiche-panier");
    //Teste si on est on mode d'impression
    var mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener(function(mql) {
        if (mql.matches) { //Avant l'impression
            $printPanier.width("800px");
            console.log($printPanier.width());

        } else { //Apres l'impression
            fermerPanier();
        }
    });

}); //Fin du $()

//Classe Livre
function Livre() {
    this.id;
    this.titre;
    this.auteur;
    this.prix;
    this.image;
    this.annee;
    this.description;
    this.nouveaute;
    this.categorie;
    this.qttDansPanier;
}

//Constructeurs
Livre.prototype.Livre = function(id, titre, auteur, prix, image, annee, description, nouveaute, categorie, qtt) {
    if (arguments.length == 0) {
        this.id = 999;
        this.titre = '!!erreur!!';
        this.auteur = '';
        this.prix = 0;
        this.image = '';
        this.annee = 0;
        this.description = '';
        this.nouveaute = false;
        this.categorie = '';
        this.qttDansPanier = 99;
    } else if (typeof arguments[0] == "object") { //Constructeur de Casting
        var o = arguments[0];
        this.setId(o.id);
        this.setTitre(o.titre);
        this.setAuteur(o.auteur);
        this.setPrix(o.prix)
        this.setImage(o.image);
        this.setAnnee(o.annee)
        this.setDescription(o.description);
        this.setNouveaute(o.nouveaute);
        this.setCategorie(o.categorie);
        this.setQtt(o.qttDansPanier);
    } else {
        this.setId(id);
        this.setTitre(titre);
        this.setAuteur(auteur);
        this.setPrix(prix)
        this.setImage(image);
        this.setAnnee(annee)
        this.setDescription(description);
        this.setNouveaute(nouveaute);
        this.setCategorie(categorie);
        this.setQtt(qtt);
    }
}

//Getters
Livre.prototype.getId = function() {
    return this.id;
}
Livre.prototype.getTitre = function() {
    return this.titre;
}
Livre.prototype.getAuteur = function() {
    return this.auteur;
}
Livre.prototype.getPrix = function() {
    return this.prix;
}
Livre.prototype.getImage = function() {
    return this.image;
}
Livre.prototype.getAnnee = function() {
    return this.annee;
}
Livre.prototype.getDescription = function() {
    return this.description;
}
Livre.prototype.getNouveaute = function() {
    return this.nouveaute;
}
Livre.prototype.getCategorie = function() {
    return this.categorie;
}

Livre.prototype.getQttDansPanier = function() {
    return this.qttDansPanier;
}

//Setters
Livre.prototype.setId = function(id) {
    this.id = id;
}
Livre.prototype.setTitre = function(titre) {
    this.titre = titre;
}
Livre.prototype.setAuteur = function(auteur) {
    this.auteur = auteur;
}
Livre.prototype.setPrix = function(prix) {
    this.prix = prix;
}
Livre.prototype.setImage = function(image) {
    this.image = image;
}
Livre.prototype.setAnnee = function(annee) {
    this.annee = annee;
}
Livre.prototype.setDescription = function(description) {
    this.description = description;
}
Livre.prototype.setNouveaute = function(nouveaute) {
    this.nouveaute = nouveaute;
}
Livre.prototype.setCategorie = function(categorie) {
    this.categorie = categorie;
}
Livre.prototype.setQtt = function(qtt) {
    this.qttDansPanier = qtt;
}

Livre.prototype.domFormatAffiche = function() {
    var livreHTML = '<div id="L' + this.id + '" class="livre-dans-affiche col-sm-4"><div class="panel panel-primary"><a id="D' + this.id + '" href="#"><div class="panel-body"><i title="Nouveauté!" class="nouveau-icon fa fa-star"></i><img src="' + path + this.image + '" class="center-block img-affiche" alt="book" /></div></a><div class="panel-footer"><div><a id="T' + this.id + '" href="#"><p class="book-titre">' + this.titre + '</p></a><p class="book-auteur">' + this.auteur + '</p><p class="book-prix">$' + this.prix.toFixed(2) + '</p><div class="add-to-cart"><a value="' + this.id + '" class="ajouter" href="#"><i class="fa fa-share"></i><i class="fa fa-shopping-cart"></i></a></div></div></div></div></div>';
    return livreHTML;
}

Livre.prototype.domFormatPanier = function() {
    var livreHTML = '<tr id="P' + this.id + '" class="livre-dans-panier"><td><img src="' + path + this.image + '" class="center-block img" alt="book"></td><td><p>' + this.titre + '</p><p class="autheur-panier">' + this.auteur + '</p><p class="prix-dans-panier">$' + this.prix.toFixed(2) + '</p></td><td><div class="supprime-du-panier"><a value="' + this.id + '" class="supprimer" href="#"><i class="fa fa-remove"></i></a></div><div style="margin-top: 8px;"><div>qtt</div><div value="' + this.id + '"><span class="plus-minus minus fa fa-minus-square"></span><span class="livre-qtt">' + this.qttDansPanier + '</span><span class="plus-minus plus fa fa-plus-square"></span></div></div></td></tr>';
    return livreHTML;
}

Livre.prototype.domFormatDetails = function() {
        var livreHTML = '<div class="col-sm-4"><img src="' + path + this.image + '" class="center-block img-details" alt="book" /></a></div>        <div class="col-sm-8">        <p class="titre-details">' + this.titre + '</p>        <p class="auteur-details">' + this.auteur + '</p>        <p class="description-details">' + this.description + '</p>            <div id="prix-et-panier" class="row">                    <div class="col-sm-6">                            <p class="prix-details">$' + this.prix.toFixed(2) + '</p>                    </div>                    <div class="col-sm-6">                            <div class="add-details">                                    <a value="' + this.id + '" class="ajouter" href="#"><i class="fa fa-share"></i><i class="fa fa-shopping-cart"></i></a>                            </div>                    </div>            </div></div>    ';
        return livreHTML;
}
//Fin de la classe Livre
