"use client";

import { SearchInterface } from "@/components/SearchInterface";
import { RoundChart } from "@/components/RoundChart";
import { useState } from "react";
import dayjs from 'dayjs';
import { useRouter } from "next/navigation";

type Round = {
    id: number;
    round_number: number;
    name: string;
    theme: string;
    tenant_id: number;
    color_primary: string;
    color_secondary: string;
    start_date: string;
    end_date: string | null;
    completed: number;
    not_completed: number;
};

type ClientSideGestaoProps = {
    rounds: Round[];
};

const ClientSideGestao = ({ rounds }: ClientSideGestaoProps) => {
    const [searchValue, setSearchValue] = useState('');
    const router = useRouter();

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const handleDateSearch = (date: string, roundDate: string | null) => {
        if (!roundDate) return false;
        if (!date.includes("/")) return false;

        const [day, month, year] = date.split("/");
        const today = dayjs();

        const searchDay = day || today.format("DD");
        const searchMonth = month || today.format("MM");
        const searchYear = year || today.format("YYYY");

        const searchDate = dayjs(`${searchYear}-${searchMonth}-${searchDay}`).toDate();

        const formattedRoundDate = new Date(roundDate);
        return formattedRoundDate >= searchDate;
    };

    const handleCompositeSearch = (searchValue: string, round: Round) => {
        const searchTerms = searchValue.split("+").map(term => term.trim());
        return searchTerms.every(term =>
            round.name.toLowerCase().includes(term.toLowerCase()) ||
            handleDateSearch(term, round.start_date) ||
            handleDateSearch(term, round.end_date)
        );
    };

    const filteredRounds = rounds
        .filter((round) => handleCompositeSearch(searchValue, round))
        .sort((a, b) => (a.start_date < b.start_date ? 1 : (a.start_date > b.start_date ? -1 : 0)));


    const handleButtonClick = (event: { name: string, type: string }) => {
        console.log("Botão 'Criar Novo' clicado!", event);
    };

    return (
        <div className="md:px-6">
            <SearchInterface
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                onButtonClick={handleButtonClick}
            />

            <div className="flex flex-wrap justify-center gap-6 py-8">
                {filteredRounds.map((round) => (
                    <RoundChart
                        key={round.id}
                        data={[
                            { name: "Concluído", value: round.completed },
                            { name: "A fazer", value: round.not_completed },
                        ]}
                        colors={[round.color_primary, round.color_secondary]}
                        start_date={new Date(round.start_date).toLocaleDateString("pt-BR", {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        })}
                        end_date={round.end_date === null ? null : new Date(round.end_date).toLocaleDateString("pt-BR", {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        })}
                        title={round.name}
                        id={round.id}
                        onEditClick={() =>
                            router.push(`/territories/${round.round_number}`)
                        }
                        onTrashClick={() => console.log("Botão 'Excluir' clicado!", round.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ClientSideGestao;
