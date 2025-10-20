function activeMenuOption(href) {
    $(".app-menu .nav-link")
    .removeClass("active")
    .removeAttr('aria-current')

    $(`[href="${(href ? href : "#/")}"]`)
    .addClass("active")
    .attr("aria-current", "page")
}

const app = angular.module("angularjsApp", ["ngRoute"])

app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("")

    $routeProvider
    .when("/", {
        templateUrl: "/login",
        controller: "loginCtrl"
    })
    .when("/postres", {
        templateUrl: "/postres",
        controller: "postresCtrl"
    })
    .when("/ingredientes", {
        templateUrl: "/ingredientes",
        controller: "ingredientesCtrl"
    })
    .otherwise({
        redirectTo: "/"
    })
})

app.run(["$rootScope", "$location", "$timeout", "$http", function($rootScope, $location, $timeout, $http) {
    function actualizarFechaHora() {
        lxFechaHora = DateTime
        .now()
        .setLocale("es")

        $rootScope.angularjsHora = lxFechaHora.toFormat("hh:mm:ss a")
        $timeout(actualizarFechaHora, 1000)
    }

    $rootScope.slide = ""

    // ======================================
    // FUNCIÓN DE LOGOUT GLOBAL
    // ======================================
    $rootScope.logout = function() {
        console.log("Iniciando proceso de logout");
        
        // Mostrar confirmación
        if (confirm("¿Está seguro de que desea cerrar sesión?")) {
            // Limpiar datos antes de la petición
            limpiarDatosTemporales();
            desconectarPusher();
            
            // Realizar petición de logout al servidor
            $http.post('/api/logout')
            .then(function(response) {
                console.log("Logout exitoso:", response.data);
                
                // Limpiar usuario actual
                $rootScope.currentUser = null;
                
                // Mostrar mensaje de despedida
                if (typeof toast === 'function') {
                    toast("Sesión cerrada correctamente. ¡Hasta luego!", 2);
                }
                
                // Redirigir al login después de un breve delay
                setTimeout(function() {
                    window.location.hash = "#/";
                    // Forzar recarga para limpiar el estado de la aplicación
                    window.location.reload();
                }, 1000);
                
            })
            .catch(function(error) {
                console.error("Error en logout:", error);
                
                // Incluso si hay error en el servidor, cerrar sesión localmente
                $rootScope.currentUser = null;
                if (typeof toast === 'function') {
                    toast("Sesión cerrada localmente", 2);
                }
                
                setTimeout(function() {
                    window.location.hash = "#/";
                    window.location.reload();
                }, 1000);
            });
        }
    };

    // ======================================
    // FUNCIÓN PARA OBTENER USUARIO ACTUAL
    // ======================================
    $rootScope.getCurrentUser = function() {
        return $http.get('/api/user/current')
        .then(function(response) {
            if (response.data.success) {
                $rootScope.currentUser = response.data.user;
                console.log("Usuario actual cargado:", $rootScope.currentUser);
                return $rootScope.currentUser;
            } else {
                $rootScope.currentUser = null;
                return null;
            }
        })
        .catch(function(error) {
            console.error("Error al obtener usuario actual:", error);
            $rootScope.currentUser = null;
            return null;
        });
    };

    // ======================================
    // VERIFICAR SESIÓN EN CADA CAMBIO DE RUTA
    // ======================================
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        const publicRoutes = ["/", "#/"];
        const currentPath = next.$$route ? next.$$route.originalPath : "/";
        
        console.log("Verificando sesión para ruta:", currentPath);
        
        // Si no es una ruta pública, verificar sesión
        if (!publicRoutes.includes(currentPath)) {
            $http.get('/api/check-session')
            .then(function(response) {
                if (!response.data.success || !response.data.logged_in) {
                    console.log("Sesión no válida, redirigiendo al login");
                    event.preventDefault();
                    $rootScope.currentUser = null;
                    window.location.hash = "#/";
                    if (typeof toast === 'function') {
                        toast("Su sesión ha expirado. Por favor, inicie sesión nuevamente.", 3);
                    }
                } else {
                    // Actualizar información del usuario si la sesión es válida
                    if (response.data.user) {
                        $rootScope.currentUser = response.data.user;
                    }
                }
            })
            .catch(function(error) {
                console.error("Error al verificar sesión:", error);
                event.preventDefault();
                $rootScope.currentUser = null;
                window.location.hash = "#/";
            });
        }
    });

    // Cargar usuario al iniciar la aplicación (si hay sesión)
    $rootScope.getCurrentUser();

    actualizarFechaHora()

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
    })
}])

// ======================================
// CONTROLLER DE LOGIN CON MEJORAS
// ======================================
app.controller("loginCtrl", function ($scope, $http, $rootScope) {
    $scope.usuario = "";
    $scope.contrasena = "";
    $scope.mensaje = "";
    $scope.cargando = false;

    // Limpiar datos al entrar al login
    limpiarDatosTemporales();
    desconectarPusher();
    $rootScope.currentUser = null;

    // Función de login
    $scope.login = function() {
        console.log("Iniciando proceso de login");
        
        if (!$scope.usuario || !$scope.contrasena) {
            $scope.mensaje = "Por favor ingresa usuario y contraseña";
            return;
        }

        $scope.cargando = true;
        $scope.mensaje = "";

        // Realizar petición de login
        $http.post('/api/login', {
            usuario: $scope.usuario,
            contrasena: $scope.contrasena
        }).then(function(response) {
            console.log("Login exitoso:", response.data);
            $scope.cargando = false;
            
            if (response.data.success) {
                $scope.mensaje = response.data.message;
                
                // Cargar información del usuario
                $rootScope.getCurrentUser().then(function() {
                    // Redirigir a la página principal después de 1 segundo
                    setTimeout(function() {
                        window.location.hash = "#/postres";
                    }, 1000);
                });
            } else {
                $scope.mensaje = response.data.message;
            }
        }).catch(function(error) {
            console.error("Error en login:", error);
            $scope.cargando = false;
            
            if (error.data && error.data.message) {
                $scope.mensaje = error.data.message;
            } else {
                $scope.mensaje = "Error de conexión. Intenta nuevamente.";
            }
        });
    };

    // Verificar si ya hay una sesión activa al cargar
    $http.get('/api/check-session').then(function(response) {
        if (response.data.success && response.data.logged_in) {
            console.log("Sesión activa encontrada, redirigiendo...");
            window.location.hash = "#/postres";
        }
    }).catch(function(error) {
        console.log("No hay sesión activa");
    });
})

// ======================================
// CONTROLLER DE POSTRES CON BÚSQUEDA INTEGRADA
// ======================================
// ======================================
// CONTROLLER DE POSTRES CON GESTIÓN DE INGREDIENTES
// ======================================
app.controller("postresCtrl", function ($scope, $http, $rootScope) {
    let timeoutPostres;
    let ingredientesTemporales = []; // Array para almacenar ingredientes temporalmente
    
    // Función de logout
    $scope.cerrarSesion = function() {
        console.log("Logout desde postresCtrl");
        $rootScope.logout();
    };
    
    // Función principal de búsqueda de postres
    function buscarPostres(termino = "") {
        console.log("Ejecutando buscarPostres() con término:", termino);
        
        if (termino.trim() === "") {
            $.get("/tbodyPostres", function (trsHTML) {
                $("#tbodyPostres").html(trsHTML);
                console.log("Tabla de postres actualizada sin filtro");
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar postres:", error);
                $("#tbodyPostres").html("<tr><td colspan='4' class='text-center text-danger'>Error al cargar postres</td></tr>");
            });
        } else {
            $.get("/postres/buscar", {
                busqueda: termino
            }, function (postres) {
                console.log("Resultados de búsqueda postres:", postres);
                
                if (postres.length === 0) {
                    $("#tbodyPostres").html("<tr><td colspan='4' class='text-center text-muted'><i class='bi bi-search'></i> No se encontraron postres con ese criterio</td></tr>");
                } else {
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
        ingredientesTemporales = [];
        actualizarListaIngredientes();
        $("#tituloFormPostre").text("Registrar Nuevo Postre");
    }

    // ===== NUEVAS FUNCIONES PARA INGREDIENTES =====
    
    // Cargar ingredientes disponibles en el select
    function cargarIngredientesDisponibles() {
        console.log("Cargando ingredientes disponibles");
        $.get("/ingredientes/disponibles", function(ingredientes) {
            let options = '<option value="">Seleccionar ingrediente...</option>';
            ingredientes.forEach(function(ing) {
                options += `<option value="${ing.idIngrediente}">${ing.nombreIngrediente} (${ing.existencias} disponibles)</option>`;
            });
            $("#SelectNombreIngrediente").html(options);
        }).fail(function(error) {
            console.error("Error al cargar ingredientes:", error);
            toast("Error al cargar ingredientes", 2);
        });
    }
    
    // Agregar ingrediente a la lista temporal
    function agregarIngredienteTemp() {
        const ingredienteId = $("#SelectNombreIngrediente").val();
        const ingredienteNombre = $("#SelectNombreIngrediente option:selected").text();
        const cantidad = $("#txtCantidad").val();
        
        if (!ingredienteId || !cantidad) {
            toast("Selecciona un ingrediente y la cantidad", 2);
            return;
        }
        
        if (parseFloat(cantidad) <= 0) {
            toast("La cantidad debe ser mayor a 0", 2);
            return;
        }
        
        // Verificar si el ingrediente ya fue agregado
        const existe = ingredientesTemporales.find(i => i.id === ingredienteId);
        if (existe) {
            // Actualizar cantidad si ya existe
            existe.cantidad = cantidad;
            existe.nombre = ingredienteNombre;
            toast("Cantidad actualizada", 2);
        } else {
            // Agregar nuevo ingrediente
            ingredientesTemporales.push({
                id: ingredienteId,
                nombre: ingredienteNombre,
                cantidad: cantidad
            });
            toast("Ingrediente agregado", 2);
        }
        
        // Limpiar campos
        $("#SelectNombreIngrediente").val("");
        $("#txtCantidad").val("");
        
        // Actualizar vista
        actualizarListaIngredientes();
    }
    
    // Actualizar la visualización de ingredientes agregados
    function actualizarListaIngredientes() {
        const container = $("#listaIngredientesPostre");
        
        if (ingredientesTemporales.length === 0) {
            container.html(`
                <p class="text-muted mb-0">
                    <i class="bi bi-info-circle"></i> No hay ingredientes agregados
                </p>
            `);
        } else {
            let html = '<div class="list-group">';
            ingredientesTemporales.forEach(function(ing, index) {
                html += `
                    <div class="list-group-item ingrediente-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${ing.nombre}</strong>
                            <span class="badge badge-cantidad bg-primary ms-2">${ing.cantidad} unidades</span>
                        </div>
                        <button type="button" 
                                class="btn btn-sm btn-outline-danger btn-eliminar-ingrediente-temp" 
                                data-index="${index}"
                                title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
            });
            html += '</div>';
            container.html(html);
        }
    }
    
    // Eliminar ingrediente de la lista temporal
    function eliminarIngredienteTemp(index) {
        ingredientesTemporales.splice(index, 1);
        actualizarListaIngredientes();
        toast("Ingrediente eliminado", 2);
    }
    
    // Guardar postre con ingredientes
    function guardarPostreConIngredientes(postreId) {
        if (ingredientesTemporales.length === 0) {
            console.log("No hay ingredientes para guardar");
            return Promise.resolve();
        }
        
        console.log("Guardando ingredientes del postre:", ingredientesTemporales);
        
        // Crear promesas para cada ingrediente
        const promesas = ingredientesTemporales.map(function(ing) {
            return $.ajax({
                url: "/postre/ingrediente/agregar",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    postre_id: postreId,
                    ingrediente_id: ing.id,
                    cantidad: ing.cantidad
                })
            });
        });
        
        return Promise.all(promesas);
    }

    // Cargar ingredientes inicialmente
    buscarPostres();
    cargarIngredientesDisponibles();
    
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
            const terminoBusqueda = $("#txtBuscarPostre").val() || "";
            buscarPostres(terminoBusqueda);
        });
    }

    // ===== EVENT LISTENERS =====
    
    // Búsqueda en tiempo real
    $(document).off("input", "#txtBuscarPostre").on("input", "#txtBuscarPostre", function() {
        const termino = $(this).val();
        console.log("Término de búsqueda de postre:", termino);
        buscarPostresDebounced(termino);
    });
    
    // Limpiar búsqueda
    $(document).off("click", "#btnLimpiarPostre").on("click", "#btnLimpiarPostre", function() {
        console.log("Limpiando búsqueda de postres");
        $("#txtBuscarPostre").val("");
        buscarPostres("");
    });

    // Agregar ingrediente al postre
    $(document).off("click", "#btnAgregarIngrediente").on("click", "#btnAgregarIngrediente", function(event) {
        event.preventDefault();
        console.log("Agregando ingrediente al postre");
        agregarIngredienteTemp();
    });
    
    // Eliminar ingrediente de la lista temporal
    $(document).off("click", ".btn-eliminar-ingrediente-temp").on("click", ".btn-eliminar-ingrediente-temp", function(event) {
        event.preventDefault();
        const index = $(this).data("index");
        console.log("Eliminando ingrediente temporal en índice:", index);
        eliminarIngredienteTemp(index);
    });

    // Guardar/actualizar postre
    $(document).off("submit", "#frmPostre").on("submit", "#frmPostre", function (event) {
        event.preventDefault();
        console.log("Formulario de postre enviado");

        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Guardando...');

        const postreData = {
            idPostre: $("#hiddenIdPostre").val() || "",
            nombrePostre: $("#txtNombre").val(),
            precio: $("#txtPrecio").val()
        };

        // Primero guardar el postre
        $.post("/postre", postreData, function(response) {
            console.log("Postre guardado exitosamente:", response);
            
            const postreId = response.postre_id;
            
            // Luego guardar los ingredientes
            guardarPostreConIngredientes(postreId)
                .then(function() {
                    console.log("Ingredientes guardados exitosamente");
                    limpiarFormularioPostre();
                    const terminoBusqueda = $("#txtBuscarPostre").val() || "";
                    buscarPostres(terminoBusqueda);
                    toast("Postre e ingredientes guardados correctamente", 3);
                })
                .catch(function(error) {
                    console.error("Error al guardar ingredientes:", error);
                    toast("Postre guardado pero hubo error con ingredientes", 2);
                })
                .finally(function() {
                    $submitBtn.prop('disabled', false).html('<i class="bi bi-save"></i> Guardar Postre');
                });
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar postre:", error);
            toast("Error al guardar el postre", 2);
            $submitBtn.prop('disabled', false).html('<i class="bi bi-save"></i> Guardar Postre');
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
                modal(html, "Ingredientes del Postre", [
                    {
                        html: '<i class="bi bi-x-circle"></i> Cerrar', 
                        class: "btn btn-secondary", 
                        fun: function (event) {
                            console.log("Cerrando modal de ingredientes");
                            $(event.target).blur();
                            setTimeout(closeModal, 10);
                        }
                    }
                ]);
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar ingredientes:", error);
                toast("Error al cargar ingredientes", 2);
            });
        } else {
            console.error("ID no encontrado");
            toast("Error: No se pudo obtener el ID del postre", 2);
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
                $("#tituloFormPostre").text("Editar Postre");
                console.log("Formulario llenado para edición");
                
                // Cargar ingredientes del postre
                $.get(`/postre/${id}/ingredientes`, function(ingredientes) {
                    console.log("Ingredientes del postre cargados:", ingredientes);
                    ingredientesTemporales = [];
                    
                    if (ingredientes && ingredientes.length > 0) {
                        ingredientes.forEach(function(ing) {
                            ingredientesTemporales.push({
                                id: ing.idIngrediente || ing.ingrediente_id,
                                nombre: ing.nombreIngrediente,
                                cantidad: ing.cantidad
                            });
                        });
                    }
                    
                    actualizarListaIngredientes();
                }).fail(function(error) {
                    console.log("No se pudieron cargar ingredientes del postre");
                });
                
                $('html, body').animate({
                    scrollTop: $("#frmPostre").offset().top - 20
                }, 500);
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar postre:", error);
            toast("Error al cargar los datos del postre", 2);
        });
    });

    // Eliminar postre
    $(document).off("click", ".btn-eliminar-postre").on("click", ".btn-eliminar-postre", function (event) {
        const id = $(this).data("id");
        const $btn = $(this);
        console.log("Intentando eliminar postre con ID:", id);
        
        if (confirm("¿Está seguro de eliminar este postre y sus ingredientes?")) {
            $btn.prop('disabled', true);
            
            $.post("/postre/eliminar", {
                id: id
            }, function(response) {
                console.log("Postre eliminado exitosamente:", response);
                const terminoBusqueda = $("#txtBuscarPostre").val() || "";
                buscarPostres(terminoBusqueda);
                toast("Postre eliminado correctamente", 3);
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar postre:", error);
                toast("Error al eliminar el postre", 2);
            }).always(function() {
                $btn.prop('disabled', false);
            });
        }
    });

    // Cancelar edición
    $(document).off("click", "#btnCancelarPostre").on("click", "#btnCancelarPostre", function (event) {
        event.preventDefault();
        console.log("Cancelando edición de postre");
        limpiarFormularioPostre();
    });
    
    // Permitir agregar ingrediente con Enter en el campo de cantidad
    $(document).off("keypress", "#txtCantidad").on("keypress", "#txtCantidad", function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            $("#btnAgregarIngrediente").click();
        }
    });
});

// ======================================
// CONTROLLER DE INGREDIENTES CON BÚSQUEDA INTEGRADA
// ======================================
app.controller("ingredientesCtrl", function ($scope, $http, $rootScope) {
    let timeoutIngredientes;
    
    // Función de logout específica del controlador (opcional)
    $scope.cerrarSesion = function() {
        console.log("Logout desde ingredientesCtrl");
        $rootScope.logout();
    };
    
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
            toast("Ingrediente guardado correctamente", 3);
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar ingrediente:", error);
            alert("Error al guardar el ingrediente");
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
            alert("Error al cargar los datos del ingrediente");
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
                toast("Ingrediente eliminado correctamente", 3);
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar ingrediente:", error);
                alert("Error al eliminar el ingrediente");
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

// ======================================
// FUNCIONES ADICIONALES Y MEJORAS
// ======================================

// Función para limpiar datos temporales antes del logout
function limpiarDatosTemporales() {
    console.log("Limpiando datos temporales");
    
    // Limpiar timeouts activos
    if (typeof timeoutPostres !== 'undefined') {
        clearTimeout(timeoutPostres);
    }
    if (typeof timeoutIngredientes !== 'undefined') {
        clearTimeout(timeoutIngredientes);
    }
    
    // Limpiar formularios
    try {
        $("#frmPostre")[0]?.reset();
        $("#frmIngredientes")[0]?.reset();
    } catch(e) {
        console.log("Error al limpiar formularios:", e);
    }
    
    // Limpiar campos de búsqueda
    $("#txtBuscarPostre").val("");
    $("#txtBuscarIngrediente").val("");
    
    // Remover elementos hidden
    $("#hiddenIdPostre").remove();
    $("#hiddenIdIngrediente").remove();
    
    console.log("Datos temporales limpiados");
}

// Función para desconectar Pusher al hacer logout
function desconectarPusher() {
    console.log("Desconectando canales de Pusher");
    
    try {
        if (typeof window.pusherPostres !== 'undefined') {
            window.pusherPostres.disconnect();
            window.pusherPostres = undefined;
        }
        
        if (typeof window.pusherIngredientes !== 'undefined') {
            window.pusherIngredientes.disconnect();
            window.pusherIngredientes = undefined;
        }
        
        console.log("Pusher desconectado exitosamente");
    } catch (error) {
        console.error("Error al desconectar Pusher:", error);
    }
}

/*


// Función para mostrar atajos de teclado (opcional)
$(document).ready(function() {
    console.log("Inicializando funciones de búsqueda mejoradas");
    
    // Atajos de teclado para búsqueda y logout
    $(document).on("keydown", function(e) {
        // Ctrl + Shift + L para logout rápido
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            // Buscar el scope actual y ejecutar logout
            const currentScope = angular.element(document.body).scope();
            if (currentScope && currentScope.$root && currentScope.$root.logout) {
                currentScope.$root.logout();
            } else {
                console.log("Logout directo por teclado");
                window.location.hash = "#/";
                window.location.reload();
            }
        }
        
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


*/

// ======================================
// CONFIGURACIÓN DE FECHA Y HORA
// ======================================
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

// ======================================
// FUNCIONES ADICIONALES PARA MODAL
// ======================================

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

// Manejo de eventos de Bootstrap para evitar problemas de aria-hidden
$(document).ready(function() {
    console.log("Configurando eventos del modal");
    
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
});

// ======================================
// FUNCIONES AUXILIARES PARA LOGOUT
// ======================================

// Función para verificar estado de sesión periódicamente (opcional)
function verificarSesionPeriodica() {
    console.log("Iniciando verificación periódica de sesión");
    
    setInterval(function() {
        // Solo verificar si no estamos en la página de login
        if (window.location.hash !== "#/" && window.location.hash !== "") {
            const scope = angular.element(document.body).scope();
            if (scope && scope.$root) {
                scope.$root.$http.get('/api/check-session')
                .then(function(response) {
                    if (!response.data.success || !response.data.logged_in) {
                        console.log("Sesión expirada detectada en verificación periódica");
                        if (typeof toast === 'function') {
                            toast("Su sesión ha expirado. Redirigiendo al login...", 3);
                        }
                        setTimeout(function() {
                            window.location.hash = "#/";
                            window.location.reload();
                        }, 2000);
                    }
                })
                .catch(function(error) {
                    console.error("Error en verificación periódica:", error);
                });
            }
        }
    }, 300000); // Verificar cada 5 minutos
}

// Inicializar verificación periódica (descomenta si la quieres usar)
// verificarSesionPeriodica();

// ======================================
// MANEJO DE EVENTOS DE VISIBILIDAD DE LA PÁGINA
// ======================================
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // La página volvió a ser visible, verificar sesión
        console.log("Página visible de nuevo, verificando sesión...");
        
        if (window.location.hash !== "#/" && window.location.hash !== "") {
            const scope = angular.element(document.body).scope();
            if (scope && scope.$root && scope.$root.$http) {
                scope.$root.$http.get('/api/check-session')
                .then(function(response) {
                    if (!response.data.success || !response.data.logged_in) {
                        console.log("Sesión no válida al regresar a la página");
                        scope.$root.currentUser = null;
                        window.location.hash = "#/";
                        if (typeof toast === 'function') {
                            toast("Su sesión ha expirado mientras estuvo ausente", 3);
                        }
                    } else if (response.data.user) {
                        // Actualizar información del usuario
                        scope.$root.currentUser = response.data.user;
                        scope.$root.$apply();
                    }
                })
                .catch(function(error) {
                    console.error("Error al verificar sesión al regresar:", error);
                });
            }
        }
    }
});

// ======================================
// FUNCIONES DE UTILIDAD ADICIONALES
// ======================================

// Función para mostrar información de sesión en consola (debug)
function mostrarInfoSesion() {
    const scope = angular.element(document.body).scope();
    if (scope && scope.$root) {
        console.log("=== INFORMACIÓN DE SESIÓN ===");
        console.log("Usuario actual:", scope.$root.currentUser);
        console.log("Hash actual:", window.location.hash);
        console.log("Pusher postres:", typeof window.pusherPostres);
        console.log("Pusher ingredientes:", typeof window.pusherIngredientes);
        console.log("===============================");
    }
}

// Hacer la función disponible globalmente para debug
window.mostrarInfoSesion = mostrarInfoSesion;

// ======================================
// COMENTARIOS Y DOCUMENTACIÓN
// ======================================

/*
=== GUÍA DE USO DEL LOGOUT ===

1. LOGOUT DESDE CUALQUIER LUGAR:
   - Usar: ng-click="$root.logout()"
   - Ejemplo: <button ng-click="$root.logout()">Cerrar Sesión</button>

2. ATAJOS DE TECLADO:
   - Ctrl + Shift + L: Logout rápido
   - Ctrl + F: Enfocar búsqueda de postres
   - Ctrl + Shift + F: Enfocar búsqueda de ingredientes
   - ESC: Limpiar búsqueda activa

3. INFORMACIÓN DEL USUARIO:
   - Disponible en: $root.currentUser
   - Ejemplo: {{$root.currentUser.username}}

4. VERIFICACIÓN DE SESIÓN:
   - Automática en cada cambio de ruta
   - Manual con: $root.getCurrentUser()

5. EJEMPLOS DE HTML:

   <!-- Botón simple -->
   <button class="btn btn-danger" ng-click="$root.logout()">
       <i class="bi bi-box-arrow-right"></i> Logout
   </button>

   <!-- Con información del usuario -->
   <div class="user-info" ng-show="$root.currentUser">
       <span>Hola, {{$root.currentUser.username}}</span>
       <button class="btn btn-outline-danger btn-sm" ng-click="$root.logout()">
           Salir
       </button>
   </div>

   <!-- Navbar completa -->
   <nav class="navbar navbar-expand-lg">
       <a class="navbar-brand" href="#/postres">Mi App</a>
       <div class="navbar-nav ms-auto" ng-show="$root.currentUser">
           <span class="nav-text me-3">{{$root.currentUser.username}}</span>
           <button class="btn btn-outline-light" ng-click="$root.logout()">
               <i class="bi bi-box-arrow-right"></i>
           </button>
       </div>
   </nav>

=== FUNCIONES DEBUG ===
- mostrarInfoSesion(): Muestra info actual en consola
- Se puede llamar desde DevTools: mostrarInfoSesion()

=== CARACTERÍSTICAS IMPLEMENTADAS ===
✅ Logout global disponible en toda la app
✅ Verificación automática de sesión en cambios de ruta
✅ Limpieza completa de datos al cerrar sesión
✅ Desconexión de canales Pusher
✅ Manejo de errores robusto
✅ Confirmación antes de cerrar sesión
✅ Atajos de teclado
✅ Verificación al regresar a la página
✅ Información del usuario disponible globalmente
✅ Compatibilidad con todos los navegadores modernos
✅ Integración perfecta con Flask backend
*/