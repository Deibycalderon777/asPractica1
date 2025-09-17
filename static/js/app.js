// ========================================
// MÓDULO PRINCIPAL
// ========================================
const app = angular.module("angularjsApp", ["ngRoute"]);

app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("");

    $routeProvider
    .when("/", {
        redirectTo: "/postres" // ✅ directo al dashboard
    })
.when("/login", {
    controller: "loginCtrl",
    resolve: {
        redirect: function() {
            // Redirige al endpoint del servidor
            window.location.href = "/login";
        }
    }
})

.when("/postres", {
    templateUrl: "templates/postres.html",
    controller: "postresCtrl",
    requireAuth: true
})
.when("/ingredientes", {
    templateUrl: "templates/ingredientes.html",
    controller: "ingredientesCtrl",
    requireAuth: true
})

    .otherwise({ redirectTo: "/login" });
});

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
app.run(["$rootScope", "$location", "$timeout", "$http", "AuthService",
function ($rootScope, $location, $timeout, $http, AuthService) {
    $http.defaults.withCredentials = true;

    const { DateTime } = luxon;

    function actualizarFechaHora() {
        const lxFechaHora = DateTime.now().setLocale("es");
        $rootScope.angularjsHora = lxFechaHora.toFormat("hh:mm:ss a");
        $timeout(actualizarFechaHora, 1000);
    }

    actualizarFechaHora();

    $rootScope.$on("$routeChangeStart", function (event, next) {
        if (next && next.requireAuth && !AuthService.isAuthenticated()) {
            event.preventDefault();
            $location.path("/login");
        }
    });
}]);

// ========================================
// SERVICIO DE AUTENTICACIÓN
// ========================================
app.service("AuthService", function ($rootScope, $http, $q, $location) {
    let authenticated = false;

    // Login
    this.login = function (credentials) {
        const deferred = $q.defer();
        $http.post("/api/login", credentials)
            .then(function (response) {
                if (response.data.success) {
                    authenticated = true;
                    $rootScope.isAuthenticated = true;
                    deferred.resolve(response.data);
                } else {
                    authenticated = false;
                    $rootScope.isAuthenticated = false;
                    deferred.reject(response.data.message || "Error de login");
                }
            })
            .catch(function (error) {
                authenticated = false;
                $rootScope.isAuthenticated = false;
                let msg = "Error de servidor";
                if (error.data && error.data.message) msg = error.data.message;
                deferred.reject(msg);
            });
        return deferred.promise;
    };

    // Logout
    this.logout = function () {
        const deferred = $q.defer();
        $http.post("/api/logout")
            .then(function (response) {
                authenticated = false;
                $rootScope.isAuthenticated = false;
                deferred.resolve(response.data);
            })
            .catch(function (error) {
                deferred.reject("Error al cerrar sesión");
            });
        return deferred.promise;
    };

    // Verificar autenticación
    this.isAuthenticated = function () {
        return authenticated;
    };
});

// ========================================
// CONTROLADOR DE LOGIN
// ========================================
app.controller("loginCtrl", function ($scope, AuthService) {
    $scope.credentials = {
        loginField: "",
        password: "",
        rememberMe: false
    };

    $scope.isLoading = false;
    $scope.alert = {
        show: false,
        message: "",
        type: "danger" // success / danger
    };

    $scope.showAlert = function(message, type="danger") {
        $scope.alert.message = message;
        $scope.alert.type = type;
        $scope.alert.show = true;
    };

    $scope.hideAlert = function() {
        $scope.alert.show = false;
    };

    $scope.login = function() {
        $scope.hideAlert();
        $scope.isLoading = true;

        AuthService.login($scope.credentials)
            .then(function (data) {
                // Login exitoso
                $scope.showAlert(data.message || "¡Login exitoso!", "success");

                // Redirigir al dashboard
                setTimeout(function () {
                    window.location.href = "#!/postres";
                }, 800);
            })
            .catch(function (errorMessage) {
                $scope.showAlert(errorMessage, "danger");
            })
            .finally(function () {
                $scope.isLoading = false;
            });
    };

    $scope.showForgotPasswordModal = function() {
        alert("Aquí se abriría el modal de recuperación de contraseña.");
    };
});


// ========================================
// CONTROLADOR DE POSTRES (DASHBOARD)
// ========================================
app.controller("postresCtrl", function ($scope) {
    const pusher = new Pusher("47f6e45eec64327334f7", { cluster: "us2" });
    const channel = pusher.subscribe("postres-channel");

    channel.bind("postres-event", function () {
        loadPostres();
    });

    function loadPostres() {
        $.get("/postres/all", function (data) {
            $scope.$apply(function () {
                $scope.postres = data;
            });
        });
    }

    loadPostres();

    $scope.addPostre = function () {
        if ($scope.newPostre) {
            $.post("/postres/add", { nombrePostre: $scope.newPostre }, function () {
                $scope.newPostre = "";
                loadPostres();
            });
        }
    };

    $scope.editPostre = function (postre) {
        postre.editing = true;
    };

    $scope.updatePostre = function (postre) {
        $.post("/postres/update", {
            idPostre: postre.idPostre,
            nombrePostre: postre.nombrePostre
        }, function () {
            postre.editing = false;
            loadPostres();
        });
    };

    $scope.deletePostre = function (id) {
        if (confirm("¿Estás seguro de eliminar este postre?")) {
            $.post("/postres/delete", { idPostre: id }, function () {
                loadPostres();
            });
        }
    };
});

// ========================================
// CONTROLADOR DE INGREDIENTES
// ========================================
app.controller("ingredientesCtrl", function ($scope, $timeout) {
    let debounceTimeout;
    const pusher = new Pusher("47f6e45eec64327334f7", { cluster: "us2" });
    const channel = pusher.subscribe("ingredientes-channel");

    channel.bind("ingredientes-event", function () {
        loadIngredientes();
    });

    function loadIngredientes(query = "") {
        $.get("/ingredientes/all", { search: query }, function (data) {
            $scope.$apply(function () {
                $scope.ingredientes = data;
            });
        });
    }

    loadIngredientes();

    $scope.searchIngredientes = function () {
        if (debounceTimeout) {
            $timeout.cancel(debounceTimeout);
        }
        debounceTimeout = $timeout(() => {
            loadIngredientes($scope.searchQuery);
        }, 300);
    };

    $scope.addIngrediente = function () {
        if ($scope.newIngrediente && $scope.newExistencias >= 0) {
            $.post("/ingredientes/add", {
                nombreIngrediente: $scope.newIngrediente,
                existencias: $scope.newExistencias
            }, function () {
                $scope.newIngrediente = "";
                $scope.newExistencias = null;
                loadIngredientes();
            });
        }
    };

    $scope.editIngrediente = function (ingrediente) {
        ingrediente.editing = true;
    };

    $scope.updateIngrediente = function (ingrediente) {
        if (ingrediente.nombreIngrediente && ingrediente.existencias >= 0) {
            $.post("/ingredientes/update", {
                idIngrediente: ingrediente.idIngrediente,
                nombreIngrediente: ingrediente.nombreIngrediente,
                existencias: ingrediente.existencias
            }, function () {
                ingrediente.editing = false;
                loadIngredientes();
            });
        }
    };

    $scope.deleteIngrediente = function (id) {
        if (confirm("¿Estás seguro de eliminar este ingrediente?")) {
            $.post("/ingredientes/delete", { idIngrediente: id }, function () {
                loadIngredientes();
            });
        }
    };

    $scope.getBadgeClass = function (existencias) {
        if (existencias >= 20) return "bg-success text-light";
        if (existencias >= 10) return "bg-warning text-dark";
        return "bg-danger text-light";
    };
});

// ========================================
// MANEJO GLOBAL DE SESIÓN Y UX
// ========================================
$(document).ready(function () {
    const sessionTimeout = 7 * 24 * 60 * 60 * 1000; // 7 días
    const warningTimeout = sessionTimeout - 5 * 60 * 1000;

    function refreshSession() {
        $.post("/refresh-session", function (response) {
            console.log(response.success ? "Sesión renovada" : "Error al renovar sesión");
        });
    }

    function checkAuthStatus() {
        $.get("/auth-status", function (response) {
            if (!response.authenticated) {
                window.location.href = "/#!/login";
            }
        });
    }

    setTimeout(refreshSession, warningTimeout);
    setInterval(checkAuthStatus, 5 * 60 * 1000);

    $(document).ajaxError(function (event, jqxhr) {
        if (jqxhr.status === 401) {
            alert("Tu sesión ha expirado. Serás redirigido al login.");
            window.location.href = "/#!/login";
        }
    });

    // UX accesos rápidos
    $(document).on("keydown", function (e) {
        if (e.ctrlKey && e.key === "f") {
            e.preventDefault();
            $("#searchInput").focus();
        }
        if (e.ctrlKey && e.shiftKey && e.key === "F") {
            e.preventDefault();
            $("#advancedSearchModal").modal("show");
        }
        if (e.key === "Escape") {
            $("#searchInput").val("");
            $("#advancedSearchModal").modal("hide");
        }
        if (e.ctrlKey && e.key === "l") {
            e.preventDefault();
            $("#logoutForm").submit();
        }
    });

    // Placeholders dinámicos
    const tips = [
        "🔎 Busca ingredientes rápidamente...",
        "🍫 Encuentra postres deliciosos...",
        "📦 Gestiona tus existencias aquí..."
    ];
    let tipIndex = 0;
    setInterval(() => {
        $("#searchInput").attr("placeholder", tips[tipIndex]);
        tipIndex = (tipIndex + 1) % tips.length;
    }, 4000);
});



