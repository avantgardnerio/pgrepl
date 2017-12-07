package net.squarelabs.pgrepl;

public class Main {
    public static void main(String[] args) throws Exception {
        App app = new App();
        app.start();
        app.join();
    }
}
