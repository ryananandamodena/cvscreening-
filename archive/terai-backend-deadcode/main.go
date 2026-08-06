package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/attendance", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Attendance endpoint"))
	}).Methods("POST")
	r.HandleFunc("/attendance", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Get attendance"))
	}).Methods("GET")
	r.HandleFunc("/leave", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Submit leave"))
	}).Methods("POST")
	r.HandleFunc("/leave/approve", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Approve leave"))
	}).Methods("PUT")
	r.HandleFunc("/leave", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Get leave requests"))
	}).Methods("GET")

	port := ":8080"
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(port, r))
}
