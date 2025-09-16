// ========================================
// FUNCIONES GLOBALES EXISTENTES
// ========================================
function activeMenuOption(href) {
    $(".app-menu .nav-link")
    .removeClass("active")
    .removeAttr('aria-current')

    $(`[href="${(href ? href : "#/")}"]`)
    .addClass("active")
    .attr("aria-current", "page")
}

// ========================================
// CONFIGURACIÓN PRINCIPAL DE LA APP CON LOGIN
// ========================================
const app = angular.module("angularjsApp", ["ngRoute"])

app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("")

    $routeProvider
    .when("/", {
        templateUrl: "/app",
        controller: "appCtrl"
    })
    .when("/login", {
        templateUrl: "/login",
        controller: "loginCtrl"
    })
    .when("/postres", {
        templateUrl: "/postres",
        controller: "postresCtrl",
        requireAuth: true  // Ruta protegida
    })
    .when("/ingredientes", {
        templateUrl: "/ingredientes",
        controller: "ingredientesCtrl",
        requireAuth: true  // Ruta protegida
    })
    .otherwise({
        redirectTo: "/login"  // Redirigir a login por defecto
    })
})

// ========================================
// SERVICIO DE AUTENTICACIÓN
// ========================================
app.service('AuthService', function($http, $q) {
    let currentUser = null;
    let isAuthenticated = false;
    
    return {
        login: function(credentials) {
            console.log("AuthService: Intentando login");
            return $http.post('/api/login', credentials)
                .then(function(response) {
                    if (response.data.success) {
                        currentUser = response.data.user;
                        isAuthenticated = true;
                        console.log("AuthService: Login exitoso", currentUser);
                        
                        // Guardar en localStorage si "recordarme" está marcado
                        if (credentials.rememberMe) {
                            localStorage.setItem('rememberedUser', JSON.stringify({
                                loginField: credentials.loginField
                            }));
                        }
                    }
                    return response.data;
                })
                .catch(function(error) {
                    console.error("AuthService: Error en login", error);
                    isAuthenticated = false;
                    currentUser = null;
                    throw error;
                });
        },
        
        logout: function() {
            console.log("AuthService: Cerrando sesión");
            return $http.post('/api/logout')
                .then(function(response) {
                    currentUser = null;
                    isAuthenticated = false;
                    localStorage.removeItem('rememberedUser');
                    console.log("AuthService: Logout exitoso");
                    return response.data;
                })
                .catch(function(error) {
                    console.error("AuthService: Error en logout", error);
                    // Limpiar datos locales aunque falle el servidor
                    currentUser = null;
                    isAuthenticated = false;
                    localStorage.removeItem('rememberedUser');
                    throw error;
                });
        },
        
        checkSession: function() {
            console.log("AuthService: Verificando sesión");
            return $http.get('/api/profile')
                .then(function(response) {
                    if (response.data.success) {
                        currentUser = response.data.user;
                        isAuthenticated = true;
                        console.log("AuthService: Sesión válida", currentUser);
                        return response.data;
                    }
                })
                .catch(function(error) {
                    console.log("AuthService: No hay sesión activa");
                    currentUser = null;
                    isAuthenticated = false;
                    return null;
                });
        },
        
        forgotPassword: function(email) {
            console.log("AuthService: Recuperando contraseña para", email);
            return $http.post('/api/forgot-password', { email: email });
        },
        
        isAuthenticated: function() {
            return isAuthenticated;
        },
        
        getCurrentUser: function() {
            return currentUser;
        },
        
        getRememberedUser: function() {
            const remembered = localStorage.getItem('rememberedUser');
            return remembered ? JSON.parse(remembered) : null;
        }
    };
});

// ========================================
// CONFIGURACIÓN DE EJECUCIÓN CON MIDDLEWARE DE AUTH
// ========================================
app.run(["$rootScope", "$location", "$timeout", "AuthService", function($rootScope, $location, $timeout, AuthService) {
    function actualizarFechaHora() {
        lxFechaHora = DateTime
        .now()
        .setLocale("es")

        $rootScope.angularjsHora = lxFechaHora.toFormat("hh:mm:ss a")
        $timeout(actualizarFechaHora, 1000)
    }

    $rootScope.slide = ""
    $rootScope.currentUser = null;
    $rootScope.isAuthenticated = false;

    actualizarFechaHora()

    // Verificar sesión al iniciar la aplicación
    AuthService.checkSession().then(function(sessionData) {
        if (sessionData && sessionData.success) {
            $rootScope.currentUser = sessionData.user;
            $rootScope.isAuthenticated = true;
            console.log("Sesión restaurada:", $rootScope.currentUser);
            
            // Si estamos en login y ya hay sesión, ir al dashboard
            if ($location.path() === '/login' || $location.path() === '/') {
                $location.path('/postres');
            }
        } else {
            // No hay sesión, ir al login
            if ($location.path() !== '/login') {
                $location.path('/login');
            }
        }
    });

    // Middleware de autenticación en cambio de ruta
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        console.log("Cambiando ruta a:", next.originalPath);
        
        // Si la ruta requiere autenticación y no estamos autenticados
        if (next.requireAuth && !AuthService.isAuthenticated()) {
            console.log("Ruta protegida, redirigiendo a login");
            event.preventDefault();
            $location.path('/login');
        }
        
        // Si estamos autenticados y tratamos de ir al login, redirigir al dashboard
        if (next.originalPath === '/login' && AuthService.isAuthenticated()) {
            console.log("Ya autenticado, redirigiendo a dashboard");
            event.preventDefault();
            $location.path('/postres');
        }
    });

    $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        $("html").css("overflow-x", "hidden")
        
        const path = current.$$route.originalPath

        if (path.indexOf("splash") == -1) {
            const active = $(".app-menu .nav-link.active").parent().index()
            const click  = $(`[href^="#${path}"]`).parent().index()

            if (active != click) {
                $rootScope.slide  = "animate__animated animate__faster animate__slideIn"
                $rootScope.slide += ((active > click) ? "Left" : "Right")
            }

            $timeout(function () {
                $("html").css("overflow-x", "auto")
                $rootScope.slide = ""
            }, 1000)

            activeMenuOption(`#${path}`)
        }
        
        // Actualizar datos del usuario en rootScope
        $rootScope.currentUser = AuthService.getCurrentUser();
        $rootScope.isAuthenticated = AuthService.isAuthenticated();
    })

    // Función global para logout
    $rootScope.logout = function() {
        console.log("Iniciando logout desde rootScope");
        AuthService.logout().then(function(response) {
            $rootScope.currentUser = null;
            $rootScope.isAuthenticated = false;
            $location.path('/login');
            
            if (typeof toast === 'function') {
                toast("Sesión cerrada exitosamente", 3);
            }
        }).catch(function(error) {
            console.error("Error en logout:", error);
            // Aún así redirigir al login
            $rootScope.currentUser = null;
            $rootScope.isAuthenticated = false;
            $location.path('/login');
        });
    };
}])

// ========================================
// CONTROLADOR DE LOGIN
// ========================================
app.controller("loginCtrl", function ($scope, $location, AuthService) {
    console.log("Inicializando controlador de login");
    
    // Verificar si ya está autenticado
    if (AuthService.isAuthenticated()) {
        console.log("Ya autenticado, redirigiendo...");
        $location.path('/postres');
        return;
    }
    
    // Variables del scope
    $scope.credentials = {
        loginField: '',
        password: '',
        rememberMe: false
    };
    
    $scope.isLoading = false;
    $scope.forgotPasswordEmail = '';
    
    $scope.alert = {
        show: false,
        message: '',
        type: 'info'
    };
    
    // Cargar usuario recordado
    const rememberedUser = AuthService.getRememberedUser();
    if (rememberedUser) {
        $scope.credentials.loginField = rememberedUser.loginField;
        $scope.credentials.rememberMe = true;
        $scope.showAlert('Usuario recordado cargado', 'success');
    }
    
    // Funciones
    $scope.showAlert = function(message, type) {
        $scope.alert = {
            show: true,
            message: message,
            type: type || 'info'
        };
        
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.alert.show = false;
            });
        }, 5000);
    };
    
    $scope.login = function() {
        if (!$scope.credentials.loginField || !$scope.credentials.password) {
            $scope.showAlert('Por favor, completa todos los campos', 'danger');
            return;
        }
        
        $scope.isLoading = true;
        
        AuthService.login($scope.credentials)
        .then(function(response) {
            $scope.isLoading = false;
            
            if (response.success) {
                $scope.showAlert('¡Login exitoso! Redirigiendo...', 'success');
                
                // Actualizar rootScope
                $scope.$root.currentUser = response.user;
                $scope.$root.isAuthenticated = true;
                
                setTimeout(function() {
                    $scope.$apply(function() {
                        $location.path('/postres'); // Redirigir al dashboard
                    });
                }, 1500);
            }
        })
        .catch(function(error) {
            $scope.isLoading = false;
            const message = error.data && error.data.message ? error.data.message : 'Error en el login';
            $scope.showAlert(message, 'danger');
        });
    };
    
    $scope.forgotPassword = function() {
        if (!$scope.forgotPasswordEmail) {
            $scope.showAlert('Por favor, ingresa tu email', 'warning');
            return;
        }
        
        AuthService.forgotPassword($scope.forgotPasswordEmail)
        .then(function(response) {
            $scope.showAlert(response.data.message, 'success');
            $scope.forgotPasswordEmail = '';
            
            // Cerrar modal si existe
            if (typeof closeModal === 'function') {
                setTimeout(closeModal, 100);
            }
        })
        .catch(function(error) {
            const message = error.data && error.data.message ? error.data.message : 'Error al enviar email';
            $scope.showAlert(message, 'danger');
        });
    };
    
    $scope.showForgotPasswordModal = function() {
        // Implementar modal o usar el existente de tu sistema
        if (typeof modal === 'function') {
            const modalContent = `
                <div class="mb-3">
                    <label for="forgotEmail" class="form-label">Email de recuperación:</label>
                    <input type="email" id="forgotEmail" class="form-control" ng-model="forgotPasswordEmail" placeholder="Ingresa tu email">
                </div>
            `;
            
            modal(modalContent, "Recuperar Contraseña", [
                {
                    html: '<i class="bi bi-paper-plane"></i> Enviar', 
                    class: "btn btn-primary", 
                    fun: function() {
                        const email = document.getElementById('forgotEmail').value;
                        $scope.forgotPasswordEmail = email;
                        $scope.forgotPassword();
                    }
                },
                {
                    html: '<i class="bi bi-x-circle"></i> Cancelar', 
                    class: "btn btn-secondary", 
                    fun: function(event) {
                        setTimeout(closeModal, 10);
                    }
                }
            ]);
        }
    };
});

// ========================================
// CONTROLADOR PRINCIPAL (DASHBOARD)
// ========================================
app.controller("appCtrl", function ($scope, $http, AuthService) {
    console.log("Inicializando controlador principal");
    
    // Verificar autenticación
    if (!AuthService.isAuthenticated()) {
        console.log("No autenticado en appCtrl");
        return;
    }
    
    $scope.user = AuthService.getCurrentUser();
    console.log("Usuario actual en dashboard:", $scope.user);
    
    // Aquí puedes agregar lógica específica del dashboard
    $scope.stats = {
        totalPostres: 0,
        totalIngredientes: 0,
        ingredientesBajos: 0
    };
    
    // Cargar estadísticas del dashboard (opcional)
    $scope.loadDashboardStats = function() {
        // Implementar según tus necesidades
        console.log("Cargando estadísticas del dashboard");
    };
    
    $scope.loadDashboardStats();
})

// ========================================
// CONTROLADORES EXISTENTES CON VERIFICACIÓN DE AUTH
// ========================================

// CONTROLLER DE POSTRES CON VERIFICACIÓN DE AUTENTICACIÓN
app.controller("postresCtrl", function ($scope, $http, AuthService) {
    console.log("Inicializando controlador de postres");
    
    // Verificar autenticación
    if (!AuthService.isAuthenticated()) {
        console.log("No autenticado en postresCtrl");
        return;
    }
    
    let timeoutPostres;
    
    // Función principal de búsqueda de postres
    function buscarPostres(termino = "") {
        console.log("Ejecutando buscarPostres() con término:", termino);
        
        if (termino.trim() === "") {
            // Cargar todos los postres
            $.get("/tbodyPostres", function (trsHTML) {
                $("#tbodyPostres").html(trsHTML);
                console.log("Tabla de postres actualizada sin filtro");
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar postres:", error);
                if (xhr.status === 401) {
                    // Sesión expirada, redirigir al login
                    $scope.$root.logout();
                }
                $("#tbodyPostres").html("<tr><td colspan='4' class='text-center text-danger'>Error al cargar postres</td></tr>");
            });
        } else {
            // Buscar con filtro
            $.get("/postres/buscar", {
                busqueda: termino
            }, function (postres) {
                console.log("Resultados de búsqueda postres:", postres);
                
                if (postres.length === 0) {
                    $("#tbodyPostres").html("<tr><td colspan='4' class='text-center text-muted'><i class='bi bi-search'></i> No se encontraron postres con ese criterio</td></tr>");
                } else {
                    // Construir HTML de la tabla
                    let html = "";
                    postres.forEach(function(postre) {
                        html += `
                            <tr>
                                <td>${postre.idPostre}</td>
                                <td>${postre.nombrePostre}</td>
                                <td>$${postre.precio}</td>
                                <td class="text-center">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button class="btn btn-outline-info btn-ingredientes" 
                                                data-idpostre="${postre.idPostre}"
                                                title="Ver ingredientes">
                                            <i class="bi bi-list-ul"></i>
                                        </button>
                                        <button class="btn btn-outline-warning btn-editar-postre" 
                                                data-id="${postre.idPostre}"
                                                title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-eliminar-postre" 
                                                data-id="${postre.idPostre}"
                                                title="Eliminar">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    $("#tbodyPostres").html(html);
                }
            }).fail(function(xhr, status, error) {
                console.error("Error en búsqueda de postres:", error);
                if (xhr.status === 401) {
                    // Sesión expirada, redirigir al login
                    $scope.$root.logout();
                }
                $("#tbodyPostres").html("<tr><td colspan='4' class='text-center text-danger'><i class='bi bi-exclamation-triangle'></i> Error en la búsqueda</td></tr>");
            });
        }
    }

    // Función con debounce para búsqueda
    function buscarPostresDebounced(termino) {
        clearTimeout(timeoutPostres);
        timeoutPostres = setTimeout(function() {
            buscarPostres(termino);
        }, 300);
    }

    function limpiarFormularioPostre() {
        console.log("Limpiando formulario de postre");
        $("#frmPostre")[0].reset();
        $("#hiddenIdPostre").remove();
    }

    // Cargar postres inicialmente
    buscarPostres();
    
    // Configuración de Pusher para postres
    Pusher.logToConsole = true;
    if (typeof window.pusherPostres === 'undefined') {
        console.log("Inicializando Pusher para postres");
        window.pusherPostres = new Pusher('df675041e275bafce4a7', {
            cluster: 'mt1'
        });

        var channel = window.pusherPostres.subscribe("canalPostres");
        channel.bind("eventoPostres", function(data) {
            console.log("Evento Pusher recibido:", data);
            // Mantener el término de búsqueda actual al actualizar
            const terminoBusqueda = $("#txtBuscarPostre").val() || "";
            buscarPostres(terminoBusqueda);
        });
    }

    // Event listener para búsqueda en tiempo real
    $(document).off("input", "#txtBuscarPostre").on("input", "#txtBuscarPostre", function() {
        const termino = $(this).val();
        console.log("Término de búsqueda de postre:", termino);
        buscarPostresDebounced(termino);
    });
    
    // Event listener para limpiar búsqueda
    $(document).off("click", "#btnLimpiarPostre").on("click", "#btnLimpiarPostre", function() {
        console.log("Limpiando búsqueda de postres");
        $("#txtBuscarPostre").val("");
        buscarPostres("");
    });

    // Guardar/actualizar postre
    $(document).off("submit", "#frmPostre").on("submit", "#frmPostre", function (event) {
        event.preventDefault();
        console.log("Formulario de postre enviado");

        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true);

        $.post("/postre", {
            idPostre: $("#hiddenIdPostre").val() || "",
            nombrePostre: $("#txtNombre").val(),
            precio: $("#txtPrecio").val()
        }, function(response) {
            console.log("Postre guardado exitosamente:", response);
            limpiarFormularioPostre();
            // Mantener búsqueda activa después de guardar
            const terminoBusqueda = $("#txtBuscarPostre").val() || "";
            buscarPostres(terminoBusqueda);
            if (typeof toast === 'function') {
                toast("Postre guardado correctamente", 3);
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar postre:", error);
            if (xhr.status === 401) {
                $scope.$root.logout();
            } else {
                alert("Error al guardar el postre");
            }
        }).always(function() {
            $submitBtn.prop('disabled', false);
        });
    });

    // Ver ingredientes de un postre
    $(document).off("click", ".btn-ingredientes").on("click", ".btn-ingredientes", function (event) {
        event.preventDefault();
        console.log("Botón ver ingredientes clickeado");
        
        const id = $(this).data("idpostre");
        console.log("ID del postre capturado:", id);
        
        if (id && id !== 'undefined' && id !== undefined) {
            $.get(`/postres/ingredientes/${id}`, function (html) {
                console.log("Ingredientes cargados exitosamente");
                if (typeof modal === 'function') {
                    modal(html, "Ingredientes del Postre", [
                        {
                            html: '<i class="bi bi-x-circle"></i> Cerrar', 
                            class: "btn btn-secondary", 
                            fun: function (event) {
                                console.log("Cerrando modal de ingredientes");
                                $(event.target).blur();
                                setTimeout(function() {
                                    if (typeof closeModal === 'function') {
                                        closeModal();
                                    }
                                }, 10);
                            }
                        }
                    ]);
                }
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar ingredientes:", error);
                if (xhr.status === 401) {
                    $scope.$root.logout();
                } else {
                    alert("Error al cargar ingredientes: " + error);
                }
            });
        } else {
            console.error("ID no encontrado");
            alert("Error: No se pudo obtener el ID del postre");
        }
    });

    // Editar postre
    $(document).off("click", ".btn-editar-postre").on("click", ".btn-editar-postre", function (event) {
        const id = $(this).data("id");
        console.log("Editando postre con ID:", id);
        
        $.get(`/postre/${id}`, function (data) {
            console.log("Datos del postre recibidos:", data);
            if (data.length > 0) {
                const postre = data[0];
                $("#txtNombre").val(postre.nombrePostre);
                $("#txtPrecio").val(postre.precio);
                
                if ($("#hiddenIdPostre").length === 0) {
                    $("#frmPostre").prepend('<input type="hidden" id="hiddenIdPostre" name="idPostre">');
                }
                $("#hiddenIdPostre").val(postre.idPostre);
                console.log("Formulario llenado para edición");
                
                $('html, body').animate({
                    scrollTop: $("#frmPostre").offset().top
                }, 500);
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar postre:", error);
            if (xhr.status === 401) {
                $scope.$root.logout();
            } else {
                alert("Error al cargar los datos del postre");
            }
        });
    });

    // Eliminar postre
    $(document).off("click", ".btn-eliminar-postre").on("click", ".btn-eliminar-postre", function (event) {
        const id = $(this).data("id");
        const $btn = $(this);
        console.log("Intentando eliminar postre con ID:", id);
        
        if (confirm("¿Está seguro de eliminar este postre?")) {
            $btn.prop('disabled', true);
            
            $.post("/postre/eliminar", {
                id: id
            }, function(response) {
                console.log("Postre eliminado exitosamente:", response);
                // Mantener búsqueda activa después de eliminar
                const terminoBusqueda = $("#txtBuscarPostre").val() || "";
                buscarPostres(terminoBusqueda);
                if (typeof toast === 'function') {
                    toast("Postre eliminado correctamente", 3);
                }
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar postre:", error);
                if (xhr.status === 401) {
                    $scope.$root.logout();
                } else {
                    alert("Error al eliminar el postre");
                }
            }).always(function() {
                $btn.prop('disabled', false);
            });
        }
    });

    // Cancelar edición
    $(document).off("click", "#btnCancelarPostre").on("click", "#btnCancelarPostre", function (event) {
        console.log("Cancelando edición de postre");
        limpiarFormularioPostre();
    });
});

// ======================================
// CONTROLLER DE INGREDIENTES CON VERIFICACIÓN DE AUTH
// ======================================
app.controller("ingredientesCtrl", function ($scope, $http, AuthService) {
    console.log("Inicializando controlador de ingredientes");
    
    // Verificar autenticación
    if (!AuthService.isAuthenticated()) {
        console.log("No autenticado en ingredientesCtrl");
        return;
    }
    
    let timeoutIngredientes;
    
    // Función principal de búsqueda de ingredientes
    function buscarIngredientes(termino = "") {
        console.log("Ejecutando buscarIngredientes() con término:", termino);
        
        if (termino.trim() === "") {
            // Cargar todos los ingredientes
            $.get("/tbodyIngredientes", function (trsHTML) {
                $("#tbodyIngredientes").html(trsHTML);
                console.log("Tabla de ingredientes actualizada sin filtro");
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar ingredientes:", error);
                if (xhr.status === 401) {
                    $scope.$root.logout();
                }
                $("#tbodyIngredientes").html("<tr><td colspan='4' class='text-center text-danger'>Error al cargar ingredientes</td></tr>");
            });
        } else {
            // Buscar con filtro
            $.get("/ingredientes/buscar", {
                busqueda: termino
            }, function (ingredientes) {
                console.log("Resultados de búsqueda ingredientes:", ingredientes);
                
                if (ingredientes.length === 0) {
                    $("#tbodyIngredientes").html("<tr><td colspan='4' class='text-center text-muted'><i class='bi bi-search'></i> No se encontraron ingredientes con ese criterio</td></tr>");
                } else {
                    // Construir HTML de la tabla
                    let html = "";
                    ingredientes.forEach(function(ingrediente) {
                        // Determinar color del badge según existencias
                        let badgeClass = "bg-success";
                        if (ingrediente.existencias < 10) {
                            badgeClass = "bg-danger";
                        } else if (ingrediente.existencias < 50) {
                            badgeClass = "bg-warning text-dark";
                        }
                        
                        html += `
                            <tr>
                                <td>${ingrediente.idIngrediente}</td>
                                <td>${ingrediente.nombreIngrediente}</td>
                                <td>
                                    <span class="badge ${badgeClass}">${ingrediente.existencias} unidades</span>
                                </td>
                                <td class="text-center">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button class="btn btn-outline-warning btn-editar-ingrediente" 
                                                data-id="${ingrediente.idIngrediente}"
                                                title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-eliminar-ingrediente" 
                                                data-id="${ingrediente.idIngrediente}"
                                                title="Eliminar">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    $("#tbodyIngredientes").html(html);
                }
            }).fail(function(xhr, status, error) {
                console.error("Error en búsqueda de ingredientes:", error);
                if (xhr.status === 401) {
                    $scope.$root.logout();
                }
                $("#tbodyIngredientes").html("<tr><td colspan='4' class='text-center text-danger'><i class='bi bi-exclamation-triangle'></i> Error en la búsqueda</td></tr>");
            });
        }
    }

    // Función con debounce para búsqueda
    function buscarIngredientesDebounced(termino) {
        clearTimeout(timeoutIngredientes);
        timeoutIngredientes = setTimeout(function() {
            buscarIngredientes(termino);
        }, 300);
    }

    function limpiarFormularioIngrediente() {
        console.log("Limpiando formulario de ingrediente");
        $("#frmIngredientes")[0].reset();
        $("#hiddenIdIngrediente").remove();
    }

    // Cargar ingredientes inicialmente
    buscarIngredientes();
    
    // Configuración de Pusher para ingredientes
    Pusher.logToConsole = true;
    if (typeof window.pusherIngredientes === 'undefined') {
        console.log("Inicializando Pusher para ingredientes");
        window.pusherIngredientes = new Pusher("48294aad3f28c3669613", {
            cluster: "us2"
        });

        var channel = window.pusherIngredientes.subscribe("canalIngredientes");
        channel.bind("eventoDeIngredientes", function(data) {
            console.log("Evento Pusher ingredientes recibido:", data);
            // Mantener el término de búsqueda actual al actualizar
            const terminoBusqueda = $("#txtBuscarIngrediente").val() || "";
            buscarIngredientes(terminoBusqueda);
        });
    }

    // Event listener para búsqueda en tiempo real
    $(document).off("input", "#txtBuscarIngrediente").on("input", "#txtBuscarIngrediente", function() {
        const termino = $(this).val();
        console.log("Término de búsqueda de ingrediente:", termino);
        buscarIngredientesDebounced(termino);
    });
    
    // Event listener para limpiar búsqueda
    $(document).off("click", "#btnLimpiarIngrediente").on("click", "#btnLimpiarIngrediente", function() {
        console.log("Limpiando búsqueda de ingredientes");
        $("#txtBuscarIngrediente").val("");
        buscarIngredientes("");
    });

    // Guardar/actualizar ingrediente
    $(document).off("submit", "#frmIngredientes").on("submit", "#frmIngredientes", function (event) {
        event.preventDefault();
        console.log("Formulario de ingrediente enviado");

        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true);

        $.post("/ingrediente", {
            idIngrediente: $("#hiddenIdIngrediente").val() || "",
            nombreIngrediente: $("#txtNombre").val(),
            existencias: $("#txtExistencias").val()
        }, function(response) {
            console.log("Ingrediente guardado exitosamente:", response);
            limpiarFormularioIngrediente();
            // Mantener búsqueda activa después de guardar
            const terminoBusqueda = $("#txtBuscarIngrediente").val() || "";
            buscarIngredientes(terminoBusqueda);
            if (typeof toast === 'function') {
                toast("Ingrediente guardado correctamente", 3);
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar ingrediente:", error);
            if (xhr.status === 401) {
                $scope.$root.logout();
            } else {
                alert("Error al guardar el ingrediente");
            }
        }).always(function() {
            $submitBtn.prop('disabled', false);
        });
    });

    // Editar ingrediente
    $(document).off("click", ".btn-editar-ingrediente").on("click", ".btn-editar-ingrediente", function (event) {
        const id = $(this).data("id");
        console.log("Editando ingrediente con ID:", id);
        
        $.get(`/ingrediente/${id}`, function (data) {
            console.log("Datos del ingrediente recibidos:", data);
            if (data.length > 0) {
                const ingrediente = data[0];
                $("#txtNombre").val(ingrediente.nombreIngrediente);
                $("#txtExistencias").val(ingrediente.existencias);
                
                if ($("#hiddenIdIngrediente").length === 0) {
                    $("#frmIngredientes").prepend('<input type="hidden" id="hiddenIdIngrediente" name="idIngrediente">');
                }
                $("#hiddenIdIngrediente").val(ingrediente.idIngrediente);
                console.log("Formulario llenado para edición");
                
                $('html, body').animate({
                    scrollTop: $("#frmIngredientes").offset().top
                }, 500);
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar ingrediente:", error);
            if (xhr.status === 401) {
                $scope.$root.logout();
            } else {
                alert("Error al cargar los datos del ingrediente");
            }
        });
    });

    // Eliminar ingrediente
    $(document).off("click", ".btn-eliminar-ingrediente").on("click", ".btn-eliminar-ingrediente", function (event) {
        const id = $(this).data("id");
        const $btn = $(this);
        console.log("Intentando eliminar ingrediente con ID:", id);
        
        if (confirm("¿Está seguro de eliminar este ingrediente?")) {
            $btn.prop('disabled', true);
            
            $.post("/ingrediente/eliminar", {
                id: id
            }, function(response) {
                console.log("Ingrediente eliminado exitosamente:", response);
                // Mantener búsqueda activa después de eliminar
                const terminoBusqueda = $("#txtBuscarIngrediente").val() || "";
                buscarIngredientes(terminoBusqueda);
                if (typeof toast === 'function') {
                    toast("Ingrediente eliminado correctamente", 3);
                }
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar ingrediente:", error);
                if (xhr.status === 401) {
                    $scope.$root.logout();
                } else {
                    alert("Error al eliminar el ingrediente");
                }
            }).always(function() {
                $btn.prop('disabled', false);
            });
        }
    });

    // Cancelar edición
    $(document).off("click", "#btnCancelarIngrediente").on("click", "#btnCancelarIngrediente", function (event) {
        console.log("Cancelando edición de ingrediente");
        limpiarFormularioIngrediente();
    });
});

// ========================================
// FUNCIONES ADICIONALES Y MEJORAS CON AUTH
// ========================================

// Interceptor global para manejar errores 401 (no autorizado)
$(document).ajaxError(function(event, xhr, settings, thrownError) {
    if (xhr.status === 401) {
        console.log("Error 401 detectado, sesión expirada");
        
        // Limpiar datos de autenticación
        const scope = angular.element(document.body).scope();
        if (scope && scope.$root && scope.$root.logout) {
            scope.$root.logout();
        } else {
            // Fallback manual
            localStorage.removeItem('rememberedUser');
            window.location.hash = '#/login';
            if (typeof toast === 'function') {
                toast("Sesión expirada. Por favor, inicia sesión nuevamente.", 4);
            }
        }
    }
});

// Función para mostrar atajos de teclado (opcional)
$(document).ready(function() {
    console.log("Inicializando funciones de búsqueda mejoradas con auth");
    
    // Atajos de teclado para búsqueda
    $(document).on("keydown", function(e) {
        // Ctrl + F para enfocar búsqueda de postres si estamos en esa página
        if (e.ctrlKey && e.key === 'f' && $("#txtBuscarPostre").length) {
            e.preventDefault();
            $("#txtBuscarPostre").focus();
        }
        
        // Ctrl + Shift + F para enfocar búsqueda de ingredientes si estamos en esa página
        if (e.ctrlKey && e.shiftKey && e.key === 'F' && $("#txtBuscarIngrediente").length) {
            e.preventDefault();
            $("#txtBuscarIngrediente").focus();
        }
        
        // ESC para limpiar búsqueda activa
        if (e.key === 'Escape') {
            if ($("#txtBuscarPostre").is(":focus")) {
                $("#btnLimpiarPostre").click();
                $("#txtBuscarPostre").blur();
            }
            if ($("#txtBuscarIngrediente").is(":focus")) {
                $("#btnLimpiarIngrediente").click();
                $("#txtBuscarIngrediente").blur();
            }
        }
        
        // Ctrl + L para logout rápido (opcional)
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            const scope = angular.element(document.body).scope();
            if (scope && scope.$root && scope.$root.logout && scope.$root.isAuthenticated) {
                if (confirm("¿Deseas cerrar sesión?")) {
                    scope.$root.logout();
                }
            }
        }
    });
    
    // Placeholder dinámico con consejos
    let contadorTips = 0;
    const tipsPostres = [
        "Buscar postres por nombre o precio...",
        "Ejemplo: 'chocolate' o '15.50'",
        "Prueba buscar por palabras parciales",
        "💡 Usa Ctrl+F para búsqueda rápida"
    ];
    
    const tipsIngredientes = [
        "Buscar ingredientes por nombre o cantidad...",
        "Ejemplo: 'harina' o '100'",
        "Encuentra ingredientes con poca existencia",
        "💡 Usa Ctrl+Shift+F para búsqueda rápida"
    ];
    
    // Cambiar tips cada 3 segundos
    setInterval(function() {
        if ($("#txtBuscarPostre").length && !$("#txtBuscarPostre").is(":focus")) {
            $("#txtBuscarPostre").attr("placeholder", tipsPostres[contadorTips % tipsPostres.length]);
        }
        if ($("#txtBuscarIngrediente").length && !$("#txtBuscarIngrediente").is(":focus")) {
            $("#txtBuscarIngrediente").attr("placeholder", tipsIngredientes[contadorTips % tipsIngredientes.length]);
        }
        contadorTips++;
    }, 3000);
});

// ========================================
// CONFIGURACIÓN DE FECHA Y HORA (EXISTENTE)
// ========================================
const DateTime = luxon.DateTime
let lxFechaHora

document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM cargado completamente");
    
    const configFechaHora = {
        locale: "es",
        weekNumbers: true,
        // enableTime: true,
        minuteIncrement: 15,
        altInput: true,
        altFormat: "d/F/Y",
        dateFormat: "Y-m-d",
        // time_24hr: false
    }

    activeMenuOption(location.hash)
    console.log("Menú activo configurado para:", location.hash);
})

// ========================================
// FUNCIONES ADICIONALES PARA MODAL (MEJORADAS)
// ========================================

// Función mejorada para cerrar modal sin errores de aria-hidden
function closeModalFixed() {
    console.log("Cerrando modal con función mejorada");
    // Quitar focus de cualquier elemento dentro del modal
    $('#modal-message').find(':focus').blur();
    
    // Pequeño delay para que el blur tome efecto
    setTimeout(function() {
        // Remover aria-hidden antes de cerrar
        $('#modal-message').removeAttr('aria-hidden');
        
        // Cerrar el modal
        $('#modal-message').modal('hide');
        
        // Devolver focus al body
        $('body').focus();
        console.log("Modal cerrado exitosamente");
    }, 10);
}

// Función de logout desde cualquier lugar de la aplicación
function globalLogout() {
    console.log("Logout global iniciado");
    const scope = angular.element(document.body).scope();
    if (scope && scope.$root && scope.$root.logout) {
        scope.$root.logout();
    } else {
        // Fallback manual
        localStorage.removeItem('rememberedUser');
        window.location.hash = '#/login';
        if (typeof toast === 'function') {
            toast("Sesión cerrada", 3);
        }
    }
}

// Manejo de eventos de Bootstrap para evitar problemas de aria-hidden
$(document).ready(function() {
    console.log("Configurando eventos del modal con auth");
    
    // Cuando el modal se está ocultando
    $(document).on('hide.bs.modal', '#modal-message', function (e) {
        console.log("Modal ocultándose");
        // Quitar focus de todos los elementos dentro del modal
        $(this).find(':focus').blur();
        
        // Remover aria-hidden temporalmente
        $(this).removeAttr('aria-hidden');
    });
    
    // Cuando el modal se ha ocultado completamente
    $(document).on('hidden.bs.modal', '#modal-message', function (e) {
        console.log("Modal completamente oculto");
        // Limpiar cualquier focus residual
        $('body').focus();
    });
    
    // Agregar botón de logout en el navbar si existe
    setTimeout(function() {
        const scope = angular.element(document.body).scope();
        if (scope && scope.$root) {
            scope.$watch('$root.isAuthenticated', function(isAuth) {
                if (isAuth && $('.navbar-nav').length) {
                    // Agregar información del usuario y botón de logout
                    const userInfo = `
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                <i class="bi bi-person-circle"></i> {{$root.currentUser.Nombre_Usuario}}
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#"><i class="bi bi-person"></i> Mi Perfil</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" ng-click="logout()">
                                    <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                                </a></li>
                            </ul>
                        </li>
                    `;
                    
                    // Solo agregar si no existe ya
                    if (!$('.nav-item.dropdown').length) {
                        $('.navbar-nav').append(userInfo);
                    }
                }
            });
        }
    }, 1000);
});

// ========================================
// FUNCIONES DE UTILIDAD PARA DEBUGGING
// ========================================

// Función para verificar el estado de autenticación desde la consola
window.checkAuthStatus = function() {
    const scope = angular.element(document.body).scope();
    if (scope && scope.$root) {
        console.log("Estado de autenticación:", {
            isAuthenticated: scope.$root.isAuthenticated,
            currentUser: scope.$root.currentUser,
            rememberedUser: localStorage.getItem('rememberedUser')
        });
    } else {
        console.log("No se pudo acceder al scope de Angular");
    }
};

// Función para forzar re-verificación de sesión
window.refreshSession = function() {
    const scope = angular.element(document.body).scope();
    if (scope && scope.$root) {
        const AuthService = angular.element(document.body).injector().get('AuthService');
        AuthService.checkSession().then(function(sessionData) {
            if (sessionData && sessionData.success) {
                scope.$root.currentUser = sessionData.user;
                scope.$root.isAuthenticated = true;
                console.log("Sesión refrescada:", sessionData.user);
            } else {
                scope.$root.currentUser = null;
                scope.$root.isAuthenticated = false;
                console.log("No hay sesión activa");
            }
            scope.$apply();
        });
    }
};

// ========================================
// CONFIGURACIÓN DE TIMEOUTS PARA SESIÓN
// ========================================

// Warning de sesión próxima a expirar (opcional)
let sessionWarningShown = false;
let sessionTimeoutWarning;

function resetSessionWarning() {
    clearTimeout(sessionTimeoutWarning);
    sessionWarningShown = false;
    
    // Mostrar warning 5 minutos antes de que expire la sesión (si es de 7 días)
    sessionTimeoutWarning = setTimeout(function() {
        if (!sessionWarningShown) {
            sessionWarningShown = true;
            if (confirm("Tu sesión expirará pronto. ¿Deseas renovarla?")) {
                window.refreshSession();
            }
        }
    }, 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 5); // 7 días - 5 minutos
}

// Resetear warning en actividad del usuario
$(document).on('click keypress scroll', function() {
    const scope = angular.element(document.body).scope();
    if (scope && scope.$root && scope.$root.isAuthenticated) {
        resetSessionWarning();
    }
});

console.log("Sistema de login con arquitectura por capas inicializado correctamente");