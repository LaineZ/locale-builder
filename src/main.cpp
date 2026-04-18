#include "sciter-x-api.h"
#include "sciter-x-def.h"
#include "sciter-x-host-callback.h"
#include "sciter-x-primitives.h"
#include "sciter-x.h"
#include "sciter-x-window.hpp"
#include <cstddef>
#include <cstdio>
#include <functional>
#include "archive.h"

class MainWindow : public sciter::window {
public:
    MainWindow() : window(SW_MAIN | SW_ENABLE_DEBUG) {
        load_file(L"res/index.htm");
        expand();
    }
};

int uimain(std::function<int()> run) {
    SciterSetOption(NULL, SCITER_SET_SCRIPT_RUNTIME_FEATURES,
      ALLOW_FILE_IO |
      ALLOW_SOCKET_IO |
      ALLOW_EVAL |
      ALLOW_SYSINFO);
    
    new MainWindow();   
    return run();
}