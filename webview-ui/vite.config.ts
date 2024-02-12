import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        graph_editor: resolve(__dirname, './index_graph_editor.html'),
        node_template_view: resolve(__dirname, './index_node_template_view.html')
      },
      output: [
        {
            entryFileNames: `assets/[name].js`,
            chunkFileNames: `assets/[name].js`,
            assetFileNames: `assets/[name].[ext]`,
            dir: "dist_graph_editor",
        },
        {
            entryFileNames: `assets/[name].js`,
            chunkFileNames: `assets/[name].js`,
            assetFileNames: `assets/[name].[ext]`,
            dir: "dist_node_template_view",
        },
      ]
    }
  },
});
